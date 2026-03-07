"""
依赖注入模块 - 提供全局共享的实例
"""
from typing import Optional
from msg import MessageManagerClass, MessageManager as _global_message_manager
from tools import FileLoader

# 全局实例引用
_message_manager: Optional[MessageManagerClass] = None
_notices: Optional[FileLoader] = None


def set_message_manager(mm: MessageManagerClass):
    """设置全局消息管理器"""
    global _message_manager
    _message_manager = mm


def get_message_manager() -> Optional[MessageManagerClass]:
    """获取全局消息管理器"""
    global _message_manager
    # 如果本地引用为空，尝试从 msg 模块获取
    if _message_manager is None:
        import msg
        _message_manager = msg.MessageManager
    return _message_manager


def set_notices(notices: FileLoader):
    """设置全局公告管理器"""
    global _notices
    _notices = notices


def get_notices() -> Optional[FileLoader]:
    """获取全局公告管理器"""
    global _notices
    return _notices
