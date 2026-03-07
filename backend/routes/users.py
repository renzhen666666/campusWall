"""
用户相关路由
"""
import os
from fastapi import APIRouter, Request, Form, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse

from config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/login")
async def login(request: Request):
    """预留的登录接口 - 未来实现用户名密码登录"""
    data = await request.json()
    username = data.get('username')
    password = data.get('password')
    
    # TODO: 实现真实的用户登录逻辑
    return {"success": False, "error": "登录功能暂未开放"}


@router.get("/{user_id}/avatar")
async def get_user_avatar(user_id: int):
    """获取用户头像"""
    avatar_folder = settings.AVATAR_FOLDER
    
    # 查找用户头像文件
    for ext in ['.png', '.jpg', '.jpeg', '.gif']:
        avatar_path = os.path.join(avatar_folder, f"{user_id}{ext}")
        if os.path.exists(avatar_path):
            return FileResponse(avatar_path)
    
    # 返回默认头像或 404
    raise HTTPException(status_code=404, detail="Avatar not found")


@router.post("/{user_id}/update")
async def update_user_profile(
    user_id: int,
    request: Request
):
    """更新用户资料"""
    # TODO: 实现用户资料更新逻辑
    return {"success": False, "error": "功能暂未开放"}
