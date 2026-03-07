"""
消息操作路由 - 墙消息相关
"""
import os
import uuid
import time
import asyncio
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Request, Form, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse

from config import get_settings
from tools import allowed_file, is_video_file, is_image_file, making_tiny_files, change_file_extension
from deps import get_message_manager

settings = get_settings()
router = APIRouter()

# 线程池
from concurrent.futures import ThreadPoolExecutor
executor = ThreadPoolExecutor(max_workers=70)


def get_cookie_settings(request: Request) -> dict:
    """根据请求来源判断 Cookie 设置"""
    # 检查是否是 HTTPS 或者来自允许的源
    origin = request.headers.get('origin', '')
    forwarded_proto = request.headers.get('x-forwarded-proto', '')
    
    # 如果是 HTTPS 或者生产环境
    is_secure = (
        request.url.scheme == 'https' or 
        forwarded_proto == 'https' or
        'https://' in origin
    )
    
    if is_secure:
        return {
            'samesite': 'none',
            'secure': True
        }
    else:
        # 开发环境使用 lax
        return {
            'samesite': 'lax',
            'secure': False
        }


@router.post("/comment/{message_id}")
async def comment_message(
    message_id: int,
    request: Request,
    text: str = Form(default=""),
    refer: str = Form(default=""),
    refer_id: str = Form(default=""),
    file: List[UploadFile] = File(default=[])
):
    """评论消息"""
    if not text:
        return {"success": False, "error": "输入不能为空"}
    
    mm = get_message_manager()
    if mm is None:
        return {"success": False, "error": "消息管理器未初始化"}
    
    if not mm.is_message_exist(message_id):
        return {"success": False, "error": "留言不存在。"}
    
    result_files = []
    
    for uploaded_file in file:
        if uploaded_file and uploaded_file.filename:
            if allowed_file(uploaded_file.filename):
                # 生成安全的文件名
                file_ext = os.path.splitext(uploaded_file.filename)[1]
                filename = f"id{message_id}_{uuid.uuid4()}_{time.time()}{file_ext}"
                file_path = os.path.join(settings.UPLOAD_FOLDER, filename)
                
                # 保存文件
                content = await uploaded_file.read()
                with open(file_path, 'wb') as f:
                    f.write(content)
                
                # 如果是视频，转换为 mp4
                if is_video_file(filename):
                    filename = change_file_extension(settings.UPLOAD_FOLDER, filename, 'mp4')
                
                result_files.append(filename)
                
                # 异步生成缩略图
                executor.submit(making_tiny_files, [filename])
            else:
                return {"success": False, "error": "文件格式不支持或文件为空。"}
    
    return mm.comment_message(id=message_id, text=text, files=result_files, refer=refer, refer_id=refer_id)


@router.post("/like/{message_id}")
async def like_message(message_id: int, request: Request):
    """点赞消息"""
    mm = get_message_manager()
    if mm is None:
        return {"success": False, "error": "消息管理器未初始化"}
    
    # 从 cookies 获取已点赞列表
    likes_cookie = request.cookies.get('likes', '')
    likes_list = [int(x) for x in likes_cookie.split(',') if x.isdigit()] if likes_cookie else []
    
    result = mm.like_message(id=message_id, like_list=likes_list)
    
    if result['success']:
        response = JSONResponse(content=result)
        cookie_settings = get_cookie_settings(request)
        
        if result['action'] == 'like':
            # 添加到 cookie
            new_likes = likes_cookie + f',{message_id}' if likes_cookie else str(message_id)
            response.set_cookie(
                key='likes',
                value=new_likes,
                max_age=60*60*24*7,
                path='/',
                httponly=False,
                **cookie_settings
            )
        elif result['action'] == 'cancel':
            # 从 cookie 移除
            likes_list = [int(like) for like in likes_cookie.split(',') if like.isdigit() and int(like) != message_id]
            response.set_cookie(
                key='likes',
                value=','.join(map(str, likes_list)),
                max_age=60*60*24*7,
                path='/',
                httponly=False,
                **cookie_settings
            )
        return response
    return result


@router.post("/dislike/{message_id}")
async def dislike_message(message_id: int, request: Request):
    """踩消息"""
    mm = get_message_manager()
    if mm is None:
        return {"success": False, "error": "消息管理器未初始化"}
    
    # 从 cookies 获取已踩列表
    dislikes_cookie = request.cookies.get('dislikes', '')
    dislikes_list = [int(x) for x in dislikes_cookie.split(',') if x.isdigit()] if dislikes_cookie else []
    
    result = mm.dislike_message(id=message_id, dislike_list=dislikes_list)
    
    if result['success']:
        response = JSONResponse(content=result)
        cookie_settings = get_cookie_settings(request)
        
        if result['action'] == 'dislike':
            new_dislikes = dislikes_cookie + f',{message_id}' if dislikes_cookie else str(message_id)
            response.set_cookie(
                key='dislikes',
                value=new_dislikes,
                max_age=60*60*24*7,
                path='/',
                httponly=False,
                **cookie_settings
            )
        elif result['action'] == 'cancel':
            dislikes_list = [int(d) for d in dislikes_cookie.split(',') if d.isdigit() and int(d) != message_id]
            response.set_cookie(
                key='dislikes',
                value=','.join(map(str, dislikes_list)),
                max_age=60*60*24*7,
                path='/',
                httponly=False,
                **cookie_settings
            )
        return response
    return result


@router.post("/submit")
async def wall_submit(
    request: Request,
    text: str = Form(default=""),
    filenames: List[str] = Form(default=[]),
    tags: str = Form(default="")
):
    """提交新消息"""
    mm = get_message_manager()
    if mm is None:
        return {"success": False, "error": "消息管理器未初始化"}
    
    if not text and not filenames:
        return {"success": False, "error": "输入不能为空"}
    
    # 解析标签
    tag_list = [t for t in tags.split(',') if t]
    
    # 验证文件
    valid_files = []
    for filename in filenames:
        if allowed_file(filename) and os.path.exists(os.path.join(settings.UPLOAD_FOLDER, filename)):
            valid_files.append(filename)
    
    mm.post_message(text=text, files=valid_files, tags=tag_list)
    
    # 异步生成缩略图
    for filename in valid_files:
        if not os.path.exists(os.path.join("static/tiny_files", filename)):
            executor.submit(making_tiny_files, [filename])
    
    return {"success": True}
