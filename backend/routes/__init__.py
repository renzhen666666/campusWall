"""
API 路由模块初始化
"""
from fastapi import APIRouter
from .api import router as api_router
from .messages import router as messages_router
from .users import router as users_router
from .admin import router as admin_router

# 创建总路由
router = APIRouter()

# 包含子路由
router.include_router(api_router, prefix="/api", tags=["API"])
router.include_router(messages_router, prefix="/api/wall", tags=["Wall"])
router.include_router(users_router, prefix="/user", tags=["Users"])
router.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
