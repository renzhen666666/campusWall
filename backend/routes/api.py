"""
API 路由 - 静态文件和消息相关
"""
import os
import json
import uuid
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Request, Query, Form, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from tools import (
    allowed_file, is_email, FileLoader, making_tiny_files
)
from deps import get_message_manager, get_notices

settings = get_settings()
router = APIRouter()


@router.post("/apps")
async def get_apps():
    """获取应用列表"""
    apps = []
    apps_dir = os.path.join('static', 'apps')
    if os.path.exists(apps_dir):
        for app in os.listdir(apps_dir):
            config_path = os.path.join(apps_dir, app, 'config.json')
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    apps.append(config)
    return {"success": True, "apps": apps}


@router.get("/static/tiny_files/{filename}")
async def get_tiny_file(filename: str):
    """获取缩略图文件"""
    tiny_path = os.path.join('static', 'tiny_files', filename)
    upload_path = os.path.join('static', 'uploads', filename)
    
    if os.path.exists(tiny_path):
        return FileResponse(tiny_path)
    elif os.path.exists(upload_path):
        return FileResponse(upload_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/static/files/{filename}")
async def get_static_file(filename: str):
    """获取上传的文件"""
    file_path = os.path.join('static', 'uploads', filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")


@router.get("/get_messages")
async def get_messages(
    request: Request,
    s: str = Query(default="newest", description="排序方式"),
    w: str = Query(default="", description="搜索关键词"),
    f: str = Query(default="all", description="过滤条件"),
    start: int = Query(default=0, ge=0),
    end: int = Query(default=10, ge=1)
):
    """获取消息列表"""
    mm = get_message_manager()
    if mm is None:
        return {"data": [], "total": 0}
    
    # 从 cookies 获取点赞/踩列表
    likes_cookie = request.cookies.get('likes', '')
    likes_list = [int(x) for x in likes_cookie.split(',') if x.isdigit()] if likes_cookie else []
    
    # session 中获取 dislikes（简化处理，使用 cookie）
    dislikes_cookie = request.cookies.get('dislikes', '')
    dislikes_list = [int(x) for x in dislikes_cookie.split(',') if x.isdigit()] if dislikes_cookie else []
    
    messages = mm.get_messages(
        like_list=likes_list,
        dislike_list=dislikes_list,
        sort=s,
        word=w,
        filter_type=f
    )
    
    paginated_messages = messages[start:end]
    
    return {
        "data": paginated_messages,
        "total": len(messages),
    }


@router.post("/notice")
async def get_notice():
    """获取公告"""
    notices = get_notices()
    return {"success": True, "content": notices.data if notices else []}


@router.get("/get_page_size")
async def get_page_size():
    """获取每页大小"""
    return {"page_size": settings.MESSAGE_PAGE_SIZE}


@router.post("/get_message_details/{message_id}")
async def get_message_details(request: Request, message_id: int):
    """获取消息详情"""
    mm = get_message_manager()
    if mm is None:
        return {"success": False, "error": "消息管理器未初始化"}
    
    likes_cookie = request.cookies.get('likes', '')
    likes_list = [int(x) for x in likes_cookie.split(',') if x.isdigit()] if likes_cookie else []
    
    dislikes_cookie = request.cookies.get('dislikes', '')
    dislikes_list = [int(x) for x in dislikes_cookie.split(',') if x.isdigit()] if dislikes_cookie else []
    
    message = mm.get_message(message_id, like_list=likes_list, dislike_list=dislikes_list)
    if message:
        return {"success": True, "message": message}
    return {"success": False, "error": "消息不存在"}


@router.post("/get_message_partitions/{message_id}")
async def get_message_partition(request: Request, message_id: int):
    """获取消息分区"""
    mm = get_message_manager()
    if mm is None:
        return {"success": False, "error": "消息管理器未初始化"}
    
    likes_cookie = request.cookies.get('likes', '')
    likes_list = [int(x) for x in likes_cookie.split(',') if x.isdigit()] if likes_cookie else []
    
    dislikes_cookie = request.cookies.get('dislikes', '')
    dislikes_list = [int(x) for x in dislikes_cookie.split(',') if x.isdigit()] if dislikes_cookie else []
    
    message = mm.get_message(message_id, like_list=likes_list, dislike_list=dislikes_list)
    if message:
        return {"success": True, "partition": message.get('tags', [])}
    return {"success": False, "error": "消息不存在"}


@router.post("/get_tags")
async def get_tags():
    """获取所有标签"""
    mm = get_message_manager()
    if mm is None:
        return []
    return list(mm.get_tags())


@router.post("/get_partition_messages")
async def get_partition_messages(request: Request):
    """获取分区消息"""
    data = await request.json()
    partition = data.get('partition', '')
    mm = get_message_manager()
    if mm is None:
        return {"success": True, "data": []}
    return {"success": True, "data": mm.get_tags_message_ids(partition)}


@router.post("/get_hot_messages")
async def get_hot_messages(request: Request):
    """获取热门消息"""
    mm = get_message_manager()
    if mm is None:
        return {"success": True, "messages": []}
    
    likes_cookie = request.cookies.get('likes', '')
    likes_list = [int(x) for x in likes_cookie.split(',') if x.isdigit()] if likes_cookie else []
    
    dislikes_cookie = request.cookies.get('dislikes', '')
    dislikes_list = [int(x) for x in dislikes_cookie.split(',') if x.isdigit()] if dislikes_cookie else []
    
    return {
        "success": True, 
        "messages": mm.get_hot_messages(like_list=likes_list, dislike_list=dislikes_list)
    }


@router.post("/help/form")
async def help_post(
    title: str = Form(default=""),
    email: str = Form(default=""),
    text: str = Form(default="")
):
    """提交帮助表单"""
    if not text:
        return {"success": False, "error": "请填写内容"}
    
    report = {
        'id': uuid.uuid4().hex,
        'title': title,
        'email': email,
        'text': text,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    help_path = os.path.join('help', 'help.json')
    if os.path.exists(help_path):
        with open(help_path, 'r', encoding='utf-8') as f:
            help_dict = json.load(f)
    else:
        help_dict = []
    
    help_dict.append(report)
    
    with open(help_path, 'w', encoding='utf-8') as f:
        json.dump(help_dict, f, ensure_ascii=False, indent=4)
    
    return {"success": True}


@router.post("/help/report/{message_id}")
async def help_report_post(
    message_id: str,
    text: str = Form(default=""),
    email: str = Form(default=""),
    category: str = Form(default="other")
):
    """举报消息"""
    categorys = {
        "spam": "垃圾信息",
        "abuse": "恶意行为",
        "other": "其他"
    }
    category_text = categorys.get(category, '其他')
    
    if text:
        report_path = os.path.join('help', 'report.json')
        if os.path.exists(report_path):
            with open(report_path, 'r', encoding='utf-8') as f:
                report_dict = json.load(f)
        else:
            report_dict = {}
        
        report_dict[message_id] = report_dict.get(message_id, [])
        
        report = {
            'id': uuid.uuid4().hex,
            'text': text,
            'email': email,
            'category': category_text,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        report_dict[message_id].append(report)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_dict, f, ensure_ascii=False, indent=4)
    
    return {"success": True}
