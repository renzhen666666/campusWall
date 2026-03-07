"""
配置管理模块
"""
import os
from typing import Set
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    # 基础配置
    APP_NAME: str = "龙高校园墙 API"
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 5412
    
    # 文件上传配置
    UPLOAD_FOLDER: str = os.path.join('static', 'uploads')
    ALLOWED_EXTENSIONS: Set[str] = {
        'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav', 
        'avi', 'mp4', 'mov', 'm4a', 'webm', 'aac', 'flac', 'mid', 'apk'
    }
    MAX_CONTENT_LENGTH: int = 500 * 1024 * 1024  # 500MB
    CHUNK_FOLDER: str = os.path.join('static', 'chunks')
    MESSAGE_PAGE_SIZE: int = 15
    
    # 消息存储路径
    LG_MESSAGES_PATH: str = os.path.join('static', 'messages')
    DELETED_MESSAGES_PATH: str = os.path.join('static', 'deleted_messages')
    
    # 邮件配置
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 465
    SENDER_EMAIL: str = ""
    EMAIL_SENDER_PASSWORD: str = ""
    
    # 数据库配置
    DB_HOST: str = ""
    DB_PASSWORD: str = ""
    
    # 头像文件夹
    AVATAR_FOLDER: str = os.path.join('static', 'avatars')
    
    # Session 配置
    SESSION_COOKIE_SAMESITE: str = "Lax"
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_HTTPONLY: bool = False
    SESSION_MAX_AGE: int = 7 * 24 * 60 * 60  # 7天

    # CORS 配置
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://192.168.1.4:5173",
        "http://127.0.0.1:5173",
        "https://wall.long-gao.com",
        "https://wall-eo.long-gao.com",
        "https://vue-longgaowall.pages.dev",
        "https://longgaowall.pages.dev",
        "https://lgwall2-frontend.edgeone.app/",
        "https://wall-test.long-gao.com"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


# 为了兼容原有代码，提供 config 字典形式
class Config:
    def __init__(self):
        settings = get_settings()
        self.config = {
            "UPLOAD_FOLDER": settings.UPLOAD_FOLDER,
            "ALLOWED_EXTENSIONS": settings.ALLOWED_EXTENSIONS,
            "MAX_CONTENT_LENGTH": settings.MAX_CONTENT_LENGTH,
            "CHUNK_FOLDER": settings.CHUNK_FOLDER,
            "MESSAGE_PAGE_SIZE": settings.MESSAGE_PAGE_SIZE,
            "lg_messages_path": settings.LG_MESSAGES_PATH,
            "deleted_messages_path": settings.DELETED_MESSAGES_PATH,
            "smtp_server": settings.SMTP_SERVER,
            "smtp_port": settings.SMTP_PORT,
            "sender_email": settings.SENDER_EMAIL,
            "email_sender_password": settings.EMAIL_SENDER_PASSWORD,
            "db_host": settings.DB_HOST,
            "db_password": settings.DB_PASSWORD,
            "AVATAR_FOLDER": settings.AVATAR_FOLDER,
        }


def cfg():
    return Config()
