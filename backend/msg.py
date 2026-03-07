"""
消息管理模块 - 使用 FastAPI 兼容的方式实现
"""
import random
import json
import uuid
import time
import sqlite3
import os
import logging
import asyncio
from threading import Thread
from datetime import datetime
from typing import Dict, List, Optional, Set
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager

# 数据库文件名
DB_NAME = os.path.join('static', 'messages', 'messages.db')

# 确保数据库目录存在
DB_DIR = os.path.dirname(DB_NAME)
if DB_DIR and not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR, exist_ok=True)

DELETE_MESSAGE_PATH = "deleted_messages"

# 日志配置
logger = logging.getLogger(__name__)


class DatabaseManager:
    """数据库管理类 - 使用线程池处理所有数据库操作"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        # 单线程池确保数据库操作串行化，避免并发冲突
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="DB-Writer")
        self._init_db()
    
    @contextmanager
    def _get_connection(self):
        """获取数据库连接的上下文管理器"""
        conn = sqlite3.connect(self.db_path, isolation_level=None)
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA synchronous=NORMAL')
        try:
            yield conn
        finally:
            conn.close()
    
    def _init_db(self):
        """初始化数据库表"""
        with self._get_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY,
                    data TEXT
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS partitions (
                    tag TEXT,
                    message_id INTEGER,
                    PRIMARY KEY (tag, message_id)
                )
            ''')
    
    # ==================== 同步读取操作 ====================
    
    def load_all_messages(self) -> Dict[int, dict]:
        """加载所有消息（同步）"""
        with self._get_connection() as conn:
            cursor = conn.execute('SELECT id, data FROM messages')
            return {row[0]: json.loads(row[1]) for row in cursor.fetchall()}
    
    def load_message(self, msg_id: int) -> Optional[dict]:
        """加载单条消息（同步）"""
        with self._get_connection() as conn:
            cursor = conn.execute('SELECT data FROM messages WHERE id=?', (msg_id,))
            row = cursor.fetchone()
            return json.loads(row[0]) if row else None
    
    def load_partitions(self) -> Dict[str, Set[int]]:
        """加载所有分区数据（同步）"""
        with self._get_connection() as conn:
            cursor = conn.execute('SELECT tag, message_id FROM partitions')
            partitions: Dict[str, Set[int]] = {}
            for tag, msg_id in cursor.fetchall():
                if tag not in partitions:
                    partitions[tag] = set()
                partitions[tag].add(msg_id)
            return partitions
    
    def get_partition_messages(self, tag: str) -> List[int]:
        """获取指定分区的消息ID列表（同步）"""
        with self._get_connection() as conn:
            cursor = conn.execute('SELECT message_id FROM partitions WHERE tag=?', (tag,))
            return [row[0] for row in cursor.fetchall()]
    
    def get_all_tags(self) -> Set[str]:
        """获取所有标签（同步）"""
        with self._get_connection() as conn:
            cursor = conn.execute('SELECT DISTINCT tag FROM partitions')
            return {row[0] for row in cursor.fetchall()}
    
    # ==================== 异步写入操作 ====================
    
    def save_message(self, msg_id: int, data: dict):
        """保存消息（异步，在独立线程中执行）"""
        self.executor.submit(self._save_message_sync, msg_id, data)
    
    def _save_message_sync(self, msg_id: int, data: dict):
        with self._get_connection() as conn:
            json_data = json.dumps(data, ensure_ascii=False)
            conn.execute('''
                INSERT INTO messages (id, data) VALUES (?, ?)
                ON CONFLICT(id) DO UPDATE SET data=?
            ''', (msg_id, json_data, json_data))
    
    def delete_message_from_db(self, msg_id: int):
        """删除消息（异步）"""
        self.executor.submit(self._delete_message_sync, msg_id)
    
    def _delete_message_sync(self, msg_id: int):
        with self._get_connection() as conn:
            conn.execute('DELETE FROM messages WHERE id=?', (msg_id,))
    
    def add_partition(self, tag: str, message_id: int):
        """添加分区（异步）"""
        self.executor.submit(self._add_partition_sync, tag, message_id)
    
    def _add_partition_sync(self, tag: str, message_id: int):
        with self._get_connection() as conn:
            conn.execute('INSERT OR IGNORE INTO partitions (tag, message_id) VALUES (?, ?)', (tag, message_id))
    
    def remove_partition(self, tag: str, message_id: int):
        """移除分区（异步）"""
        self.executor.submit(self._remove_partition_sync, tag, message_id)
    
    def _remove_partition_sync(self, tag: str, message_id: int):
        with self._get_connection() as conn:
            conn.execute('DELETE FROM partitions WHERE tag=? AND message_id=?', (tag, message_id))
    
    def remove_all_partitions_for_message(self, message_id: int):
        """移除消息的所有分区（异步）"""
        self.executor.submit(self._remove_all_partitions_sync, message_id)
    
    def _remove_all_partitions_sync(self, message_id: int):
        with self._get_connection() as conn:
            conn.execute('DELETE FROM partitions WHERE message_id=?', (message_id,))
    
    def remove_partition_tag(self, tag: str):
        """删除整个标签分区（异步）"""
        self.executor.submit(self._remove_partition_tag_sync, tag)
    
    def _remove_partition_tag_sync(self, tag: str):
        with self._get_connection() as conn:
            conn.execute('DELETE FROM partitions WHERE tag=?', (tag,))


class Message:
    def __init__(self, db_manager: DatabaseManager, msg_id: int, info: Optional[dict] = None):
        self.db_manager = db_manager
        self.id = msg_id
        
        if info is not None:
            self.info = info.copy()
        else:
            self.info = db_manager.load_message(msg_id)
            if self.info is None:
                self.info = {'id': msg_id}
        
        # 确保默认字段存在
        if 'comments' not in self.info:
            self.info['comments'] = []
        if 'files' not in self.info:
            self.info['files'] = []
        if 'likes' not in self.info:
            self.info['likes'] = 0
        if 'dislikes' not in self.info:
            self.info['dislikes'] = 0
    
    def save(self):
        """异步保存到数据库"""
        self.db_manager.save_message(self.id, self.info)
    
    def comment(self, text: str, files: List[str] = None, refer: str = '', refer_id: str = '') -> dict:
        if files is None:
            files = []
        comment = {
            'id': uuid.uuid4().hex,
            'text': text,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'likes': 0,
            'dislikes': 0,
            'files': files
        }
        if refer:
            comment['refer'] = refer
        if refer_id:
            comment['refer_id'] = refer_id
        
        self.info['comments'].append(comment)
        self.save()
        return comment
    
    def like(self):
        self.info['likes'] += 1
        self.save()
    
    def like_cancel(self):
        self.info['likes'] -= 1
        self.save()
    
    def dislike(self):
        self.info['dislikes'] += 1
        self.save()
    
    def dislike_cancel(self):
        self.info['dislikes'] -= 1
        self.save()
    
    def delete_comment(self, comment_id: str):
        self.info['comments'] = [c for c in self.info['comments'] if c['id'] != comment_id]
        self.save()
    
    def __str__(self):
        return str(self.info)


class PartitionManager:
    """分区管理类 - 基于内存和DatabaseManager"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        self.tags: Set[str] = set()
        self._partition_cache: Dict[str, List[int]] = {}
        self._load_from_db()
    
    def _load_from_db(self):
        """从数据库加载分区数据到内存"""
        partitions = self.db_manager.load_partitions()
        self.tags = set(partitions.keys())
        self._partition_cache = {tag: list(msg_ids) for tag, msg_ids in partitions.items()}
    
    def find_partition(self, query: str) -> str:
        """查找匹配的分区（模糊匹配）"""
        for key in self.tags:
            if (query.lower() in key.lower()) or (key.lower() in query.lower()):
                return key
        return query
    
    def add_partition(self, tag: str, message_id: int) -> str:
        """添加分区"""
        tag = self.find_partition(tag)
        
        # 异步保存到数据库
        self.db_manager.add_partition(tag, message_id)
        
        # 更新内存缓存
        self.tags.add(tag)
        if tag not in self._partition_cache:
            self._partition_cache[tag] = []
        if message_id not in self._partition_cache[tag]:
            self._partition_cache[tag].append(message_id)
        
        return tag
    
    def get_partition_messages(self, tag: str) -> List[int]:
        """获取分区的消息列表（从内存获取）"""
        return self._partition_cache.get(tag, [])
    
    def get_tags(self) -> Set[str]:
        """获取所有标签（从内存获取）"""
        return self.tags
    
    def delete_partition(self, tag: str):
        """删除整个分区"""
        self.db_manager.remove_partition_tag(tag)
        self.tags.discard(tag)
        self._partition_cache.pop(tag, None)
    
    def delete_message(self, message: dict):
        """从分区中删除消息"""
        partitions = message.get('partitions', [])
        if partitions:
            for partition in partitions:
                self.db_manager.remove_partition(partition, message['id'])
                if partition in self._partition_cache:
                    self._partition_cache[partition] = [
                        m for m in self._partition_cache[partition] if m != message['id']
                    ]
        else:
            self.delete_message_from_all_tags(message['id'])
    
    def delete_message_from_all_tags(self, message_id: int):
        """从所有标签中删除消息"""
        self.db_manager.remove_all_partitions_for_message(message_id)
        for tag in self._partition_cache:
            self._partition_cache[tag] = [
                m for m in self._partition_cache[tag] if m != message_id
            ]


class MessageManagerClass:
    """消息管理类 - 核心业务逻辑"""
    
    def __init__(self, message_dir: str):
        self.message_dir = message_dir
        self.db_manager = DatabaseManager(DB_NAME)
        self.partitionManager = PartitionManager(self.db_manager)
        self.msgMap: Dict[int, Message] = dict()
        self.msgLst: List[dict] = list()
        self.hot_messages: List[dict] = []
        
        self._load_messages_to_memory()
        self.hot_messages = self.refresh_hot_messages()
        self.auto_update()
    
    def _load_messages_to_memory(self):
        """从数据库加载所有消息到内存"""
        messages_data = self.db_manager.load_all_messages()
        for msg_id, msg_info in messages_data.items():
            self.msgMap[int(msg_id)] = Message(
                db_manager=self.db_manager,
                msg_id=msg_id,
                info=msg_info
            )
            self.msgLst.append(msg_info)
    
    def auto_update(self):
        Thread(target=self.auto_refresh_hot_messages, daemon=True).start()
    
    def auto_refresh_hot_messages(self):
        while True:
            self.refresh_hot_messages()
            time.sleep(3600)
    
    def get_tags_message_ids(self, query: str) -> List[int]:
        query = self.partitionManager.find_partition(query)
        return self.partitionManager.get_partition_messages(query)
    
    def get_message(self, msg_id: int, like_list: List[int] = None, dislike_list: List[int] = None) -> Optional[dict]:
        if like_list is None:
            like_list = []
        if dislike_list is None:
            dislike_list = []
        msg = self.msgMap.get(msg_id)
        if not msg:
            return None
        return self.deal_like_action(msg.info, like_list, dislike_list)
    
    def is_message_exist(self, msg_id: int) -> bool:
        return msg_id in self.msgMap
    
    def deal_like_action(self, msg: dict, like_list: List[int], dislike_list: List[int]) -> dict:
        msg_id = int(msg['id'])
        msg['liked'] = msg_id in like_list
        msg['disliked'] = msg_id in dislike_list
        return msg
    
    def get_all_messages(self) -> List[dict]:
        return self.msgLst
    
    def get_all_messages_id_list(self) -> List[int]:
        return [msg['id'] for msg in self.msgLst]
    
    def get_message_list(self) -> List[dict]:
        self.msgLst = [msg.info for msg in self.msgMap.values()]
        return self.msgLst
    
    def post_message(self, text: str, files: List[str] = None, tags: List[str] = None) -> int:
        """发布新消息"""
        if files is None:
            files = []
        if tags is None:
            tags = []
        
        message_id = self.create_id()
        message = {
            'id': message_id,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'text': text,
            'files': files,
            'likes': 0,
            'dislikes': 0,
            'tags': tags,
            'comments': []
        }
        
        # 处理分区
        partitions = []
        for tag in tags:
            partitions.append(self.partitionManager.add_partition(tag, message_id))
        message['partitions'] = partitions
        
        # 创建消息对象
        msg = Message(db_manager=self.db_manager, msg_id=message_id, info=message)
        msg.save()

        self.msgLst.append(message)
        self.msgMap[int(message_id)] = msg
        
        return message_id
    
    def get_messages(self, like_list: List[int] = None, dislike_list: List[int] = None, 
                     sort: str = 'newest', word: str = '', filter_type: str = '') -> List[dict]:
        if like_list is None:
            like_list = []
        if dislike_list is None:
            dislike_list = []
        
        # 搜索
        messages = self.search_messages(self.get_message_list(), word)
        # 过滤
        messages = self.filter_messages(messages, filter_type)
        # 排序
        messages = self.sort_messages(messages, sort)
        # 处理点赞状态
        messages = self.deal_with_messages(messages, like_list, dislike_list)
        
        return messages
    
    def comment_message(self, id: int, text: str, files: List[str] = None, 
                        refer: str = '', refer_id: str = '') -> dict:
        if files is None:
            files = []
        msg = self.msgMap.get(id)
        if msg:
            comment = msg.comment(text, files, refer=refer, refer_id=refer_id)
            return {'success': True, "comment": comment}
        return {'success': False, 'error': '留言不存在。'}
    
    def like_message(self, id: int, like_list: List[int]) -> dict:
        msg = self.msgMap.get(id)
        if msg:
            if id not in like_list:
                msg.like()
                return {'success': True, 'likes': msg.info['likes'], 'action': 'like'}
            else:
                msg.like_cancel()
                return {'success': True, 'likes': msg.info['likes'], 'action': 'cancel'}
        return {'success': False, 'error': '留言不存在。'}
    
    def dislike_message(self, id: int, dislike_list: List[int]) -> dict:
        msg = self.msgMap.get(id)
        if msg:
            if id not in dislike_list:
                msg.dislike()
                return {'success': True, 'action': 'dislike'}
            else:
                msg.dislike_cancel()
                return {'success': True, 'action': 'cancel'}
        return {'success': False, 'error': '留言不存在。'}
    
    def search_messages(self, messages: List[dict], word: str) -> List[dict]:
        if word:
            return [msg for msg in messages if word in msg['text']]
        return messages
    
    def filter_messages(self, messages: List[dict], filter_critical: str) -> List[dict]:
        if filter_critical == 'files':
            messages = [msg for msg in messages if msg['files']]
        return messages
    
    def sort_messages(self, messages: List[dict], sort: str) -> List[dict]:
        messages.sort(key=lambda x: x['timestamp'], reverse=True)
        if sort == 'likes':
            messages.sort(key=lambda x: x['likes'], reverse=True)
        elif sort == 'dislikes':
            messages.sort(key=lambda x: x['dislikes'], reverse=True)
        return messages
    
    def deal_with_messages(self, messages: List[dict], like_list: List[int], dislike_list: List[int]) -> List[dict]:
        return [self.deal_like_action(msg, like_list, dislike_list) for msg in messages]
    
    def delete_message(self, msg_id: int) -> dict:
        msg = self.msgMap.get(msg_id)
        if msg:
            self.db_manager.delete_message_from_db(msg_id)
            # 从内存中移除
            if msg_id in self.msgMap:
                del self.msgMap[msg_id]
            self.msgLst = [m for m in self.msgLst if m['id'] != msg_id]
            return {'success': True, 'message': '删除成功。'}
        return {'success': False, 'message': '消息不存在或已被删除'}
    
    def delete_comment(self, message_id: int, comment_id: str) -> dict:
        msg = self.msgMap.get(message_id)
        if msg:
            msg.delete_comment(comment_id)
            return {'success': True, 'message': '评论删除成功。'}
        return {'success': False, 'message': '消息不存在或已被删除'}
    
    def create_id(self) -> int:
        msg_id = random.randint(1000000, 9999999)
        while msg_id in [msg['id'] for msg in self.msgLst]:
            msg_id = random.randint(1000000, 9999999)
        return msg_id
    
    def get_tags(self) -> Set[str]:
        return self.partitionManager.get_tags()
    
    def score_message(self, message: dict) -> float:
        score = 0
        score += (message['likes'] - message['dislikes']) * 10
        score += len(message['files']) * 5
        score += len(message.get('tags', [])) * 2
        score += len(message['comments']) * 10
        score += len(message['text'])
        try:
            score -= (datetime.now() - datetime.strptime(message['timestamp'], '%Y-%m-%d %H:%M:%S')).total_seconds() / 86400
        except:
            pass
        return score
    
    def refresh_hot_messages(self) -> List[dict]:
        messages = self.get_all_messages()
        messages.sort(key=lambda x: self.score_message(x), reverse=True)
        hot_messages = messages[:20]
        self.hot_messages = hot_messages
        return hot_messages

    def get_hot_messages(self, like_list: List[int] = None, dislike_list: List[int] = None) -> List[dict]:
        if like_list is None:
            like_list = []
        if dislike_list is None:
            dislike_list = []
        hot_messages = self.deal_with_messages(self.hot_messages, like_list, dislike_list)
        return hot_messages


# 全局消息管理器实例
MessageManager: Optional[MessageManagerClass] = None


def init_message_manager(message_dir: str):
    """初始化消息管理器"""
    global MessageManager
    MessageManager = MessageManagerClass(message_dir)
    return MessageManager
