import os
import json
import time
import shutil
import uuid
import re
import secrets
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from threading import Thread
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, Request, Form, File, UploadFile, Depends, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from fastapi import FastAPI, Request, Query, Form, File, UploadFile
from contextlib import asynccontextmanager

from config import get_settings, Config
from msg import init_message_manager
from tools import FileLoader, allowed_file, making_tiny_files, is_image_file, is_video_file, get_file_extension
from database import Database
from mail import MailSender
from deps import set_message_manager, set_notices

# 配置
settings = get_settings()
config = Config().config

# 线程池
executor = ThreadPoolExecutor(max_workers=70)

# 全局变量（仅在本模块使用，通过 deps 模块共享）
MessageManager = None
Notices = None
EmailSender = None
db = None


def setup_logging():
    """设置日志"""
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # 创建日志处理器
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] %(levelname)s: %(message)s',
        handlers=[
            logging.FileHandler('logs/info.log', encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)


logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global MessageManager, Notices, EmailSender, db
    
    # 启动时初始化
    logger.info("正在初始化应用...")
    
    # 初始化消息管理器
    MessageManager = init_message_manager(config['lg_messages_path'])
    # 设置到 deps 模块，确保所有路由使用同一个实例
    set_message_manager(MessageManager)
    
    # 初始化公告加载器
    notice_path = os.path.join('static', 'notice.json')
    Notices = FileLoader(notice_path)
    # 设置到 deps 模块
    set_notices(Notices)
    
    # 初始化邮件发送器
    if config.get('smtp_server'):
        EmailSender = MailSender(
            config['smtp_server'],
            config.get('smtp_port', 465),
            config.get('sender_email', ''),
            config.get('email_sender_password', '')
        )
    
    # 初始化数据库连接
    #if config.get('db_host'):
    #    db = Database(config['db_host'], config.get('db_password', ''))
    
    # 确保必要的目录存在
    os.makedirs(config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(config['CHUNK_FOLDER'], exist_ok=True)
    os.makedirs(config['AVATAR_FOLDER'], exist_ok=True)
    
    logger.info("应用初始化完成")
    
    yield
    
    # 关闭时清理
    logger.info("正在关闭应用...")


# 创建 FastAPI 应用
app = FastAPI(
    title="龙高校园墙 API",
    description="龙高校园墙后端服务 - FastAPI 版本",
    version="2.0.0",
    lifespan=lifespan
)

# 添加中间件
app.add_middleware(ProxyHeadersMiddleware)

# CORS 配置 - 允许携带凭证的跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Content-Disposition", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Set-Cookie", "Content-Type", "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"],
    max_age=3600,
)

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")


# ==================== 导入路由 ====================
from routes import router as main_router
app.include_router(main_router)


# ==================== 文件上传相关路由 ====================

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok"}


@app.post("/api/chunked_upload")
async def chunked_upload(
    chunk: UploadFile = File(...),
    chunkIndex: int = Form(...),
    totalChunks: int = Form(...),
    fileKey: str = Form(...),
    originalName: str = Form(...)
):
    """分片上传"""
    try:
        if not allowed_file(originalName):
            return {"success": False, "error": "文件格式不允许"}
        
        # 创建文件标识符目录
        file_dir = os.path.join(config['CHUNK_FOLDER'], fileKey)
        os.makedirs(file_dir, exist_ok=True)
        
        # 保存分片
        chunk_content = await chunk.read()
        chunk_path = os.path.join(file_dir, f"{chunkIndex:05d}_{chunk.filename}")
        with open(chunk_path, 'wb') as f:
            f.write(chunk_content)
        
        # 记录上传状态
        uploaded_chunks = len([f for f in os.listdir(file_dir) if re.match(r'^\d{5}_', f)])
        
        # 保存元数据
        metadata_path = os.path.join(file_dir, 'metadata.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump({
                'original_name': originalName,
                'total_chunks': totalChunks,
                'timestamp': time.time()
            }, f)
        
        return {
            "success": True,
            "uploadedChunks": uploaded_chunks,
            "totalChunks": totalChunks
        }
    except Exception as e:
        logger.error(f"分片上传失败: {str(e)}")
        return {"success": False, "error": str(e)}


@app.post("/api/merge_chunks")
async def merge_chunks(request: Request):
    """合并分片"""
    try:
        data = await request.json()
        file_key = data['fileKey']
        
        chunk_dir = os.path.join(config['CHUNK_FOLDER'], file_key)
        if not os.path.exists(chunk_dir):
            return {"success": False, "error": "分片目录不存在"}
        
        # 从元数据获取总分片数
        with open(os.path.join(chunk_dir, 'metadata.json')) as f:
            metadata = json.load(f)
        
        # 获取分片文件
        chunk_files = sorted(
            [f for f in os.listdir(chunk_dir) if re.match(r'^\d{5}_', f)],
            key=lambda x: int(re.match(r'^(\d{5})_', x).group(1))
        )
        
        expected_chunks = metadata['total_chunks']
        
        # 验证分片完整性
        if len(chunk_files) != expected_chunks:
            return {
                "success": False,
                "error": f"分片不完整，缺少{expected_chunks - len(chunk_files)}个分片"
            }
        
        # 生成安全的文件名
        filename = f"{uuid.uuid4()}_{metadata['original_name']}"
        upload_path = os.path.join(config['UPLOAD_FOLDER'], filename)
        
        # 合并分片
        with open(upload_path, 'wb') as output_file:
            for chunk_file in chunk_files:
                chunk_path = os.path.join(chunk_dir, chunk_file)
                with open(chunk_path, 'rb') as input_file:
                    shutil.copyfileobj(input_file, output_file)
                os.remove(chunk_path)
        
        # 图片格式转换
        if is_image_file(filename) and get_file_extension(filename) != '.png':
            from tools import change_image_file_extension
            filename = change_image_file_extension(config['UPLOAD_FOLDER'], filename)
        
        # 异步生成缩略图
        thread = Thread(target=making_tiny_files, args=(filename,))
        thread.start()
        
        # 清理元数据
        os.remove(os.path.join(chunk_dir, 'metadata.json'))
        os.rmdir(chunk_dir)
        
        return {"success": True, "filenames": [filename]}
    except Exception as e:
        logger.error(f"合并文件失败: {str(e)}")
        return {"success": False, "error": str(e)}


@app.post("/api/direct_upload")
async def direct_upload(
    file: UploadFile = File(...),
    originalName: str = Form(...)
):
    """直接上传文件"""
    try:
        if not allowed_file(file.filename):
            return {"success": False, "error": "文件类型不支持"}
        
        # 保存完整文件
        filename = f"{uuid.uuid4()}_{originalName}"
        file_path = os.path.join(config['UPLOAD_FOLDER'], filename)
        
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # 图片格式转换
        if is_image_file(filename) and get_file_extension(filename) != '.png':
            from tools import change_image_file_extension
            filename = change_image_file_extension(config['UPLOAD_FOLDER'], filename)
        elif is_video_file(filename) and get_file_extension(filename) != '.mp4':
            from tools import change_video_file_extension
            filename = change_video_file_extension(config['UPLOAD_FOLDER'], filename)
        
        # 异步生成缩略图
        thread = Thread(target=making_tiny_files, args=(filename,))
        thread.start()
        
        return {"success": True, "filenames": [filename]}
    except Exception as e:
        logger.error(f"直接上传失败: {str(e)}")
        return {"success": False, "error": str(e)}


# ==================== 错误处理 ====================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    logger.error(f"未处理的异常: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "服务器内部错误"}
    )


# ==================== 主程序入口 ====================

if __name__ == '__main__':
    import uvicorn
    
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1
    )
