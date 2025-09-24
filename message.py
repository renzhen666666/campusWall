import random
import os
import json
import uuid
import time
from datetime import datetime
from threading import Thread
import shutil

REFRESH_INTERVAL = 0.2
SAVE_INTERVAL = 5

DELETE_MESSAGE_PATH = "deleted_messages"


class Message:
    def __init__(self, message_dir:str, id:int, message={}):
        self.id = id
        self.message_data_path = os.path.join(message_dir, str(id))
        
        try:
            with open(os.path.join(self.message_data_path, 'message.json'),'r', encoding='utf-8') as f:
                self.info = json.load(f)
        except:
            os.makedirs(self.message_data_path, exist_ok=True)
            with open(os.path.join(self.message_data_path, 'message.json'), 'w', encoding='utf-8') as f:
                json.dump(message, f)
            self.info = message

    def save(self):
        with open(os.path.join(self.message_data_path, 'message.json'), 'w', encoding='utf-8') as f:
            json.dump(self.info, f, indent=2)

    def comment(self, text, files=[], refer='', refer_id=''):
        comment = {
        'id': uuid.uuid4().hex,
        'text': text,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'likes': 0,
        'dislikes': 0,
        'files': files
        }
        if refer: comment['refer'] = refer
        if refer_id: comment['refer_id'] = refer_id
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

    def delete_comment(self, id):
        self.info['comments'] = [c for c in self.info['comments'] if c['id'] != id]
        self.save()

    def __str__(self):
        return str(self.info)

    def destroy(self):
        if os.path.exists(self.message_data_path):
            shutil.move(self.message_data_path, DELETE_MESSAGE_PATH)

class FileLoader:
    def __init__(self, path):
        self.path = path
        try:
            with open(path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        except:
            self.data = {}

        Thread(target=self.auto_save_data, daemon=True).start()

    def save_data(self):
        with open(self.path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=4)

    def auto_save_data(self):
        while True:
            try:
                self.save_data()
            except Exception as e:
                print(f"Error loading data from {self.path}: {e}")
            time.sleep(5)

    def appendChild(self, key:str, item:int):
        self.data[key] = list(set(self.data.get(key, [])) | {item})
        self.save_data()

    def get_tags(self):
        return set(self.data.keys())
    
    def delete_message(self, partition:str, message_id:int):
        self.data[partition] = [m for m in self.data.get(partition, []) if m != message_id]
        self.save_data()

    def delete_message_from_all_tags(self, message_id:int):
        for key, value in self.partitions.data.items():
            if message_id in value:
                self.data[key] = [m for m in value if m != message_id]
                self.save_data()


class partitionManager:
    def __init__(self, path):
        self.path = path
        self.partitions = FileLoader(path)
        self.tags = set(self.partitions.get_tags())

    def find_partition(self, query:str):
        for key, value in self.partitions.data.items():
            if (query.lower() in key.lower()) or (key.lower() in query.lower()):
                return key
        return query
    
    def add_partition(self, tag:str, message_id:int):
        tag = self.find_partition(tag)

        self.partitions.appendChild(tag, message_id)
        self.tags.add(tag)

        return tag

    def get_partition_messages(self, tag:str):
        return self.partitions.data.get(tag, [])

    def get_tags(self):
        return self.partitions.get_tags()
    
    def delete_partition(self, tag:str):
        self.partitions.data.pop(tag)
        self.tags.remove(tag)
        self.partitions.save_data()

    def delete_message(self, message):
        partitions = message.get('partitions', [])
        if partitions:
            for partition in partitions:
                self.partitions.delete_message(partition, message['id'])
        else:
            self.partitions.delete_message_from_all_tags(message['id'])


class MessageManager:
    def __init__(self, message_dir):
        self.message_dir = message_dir
        self.messages_dict = self.get_all_messages_dict()
        self.messages_list = self.get_all_messages_list()
        self.partitionManager = partitionManager(os.path.join('static', 'partition.json'))
        self.hot_messages = self.refresh_hot_messages()

        self.auto_update()

    def auto_update(self):
        Thread(target=self.auto_refresh_thread).start()
        Thread(target=self.auto_refresh_hot_messages).start()

    def auto_refresh_thread(self):
        while True:
            self.messages_list = self.get_all_messages_list()
            time.sleep(REFRESH_INTERVAL)

    def auto_refresh_hot_messages(self):
        while True:
            self.refresh_hot_messages()
            time.sleep(3600)

    def get_messages_list(self):
        return [msg['id'] for msg in self.messages_list]

    def get_tags_message_ids(self, query:str):
        query = self.partitionManager.find_partition(query)
        return self.partitionManager.get_partition_messages(query)

    def get_hot_messages(self, like_list=[], dislike_list=[]):
        messages = self.deal_messages(self.hot_messages, like_list, dislike_list)

    def get_message(self, id:str, like_list=[], dislike_list=[]):
        message = self.messages_dict.get(id)
        if message:
            message_info = message.info
            if str(message_info['id']) in like_list:
                message_info['liked'] = 1
            else:
                message_info['liked'] = 0
            if str(message_info['id']) in dislike_list:
                message_info['disliked'] = 1
            else:
                message_info['disliked'] = 0
        else:
            message_info = {}
        return message_info


    def get_all_messages_dict(self):
        messages_dict = {}
        for filename in os.listdir(self.message_dir):
            message = Message(message_dir=self.message_dir, id=int(filename))
            messages_dict[str(message.info['id'])] = message
        return messages_dict

    def get_all_messages_list(self):
        messages_list = list()
        for key, message in self.messages_dict.items():
            messages_list.append(message.info)
        return messages_list
    

    def post_message(self, text, files=[], tags=[]):
        message_id = self.create_id()
        message = ({
            'id': message_id,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'text': text,
            'files': files,
            'likes': 0,
            'dislikes': 0,
            'tags': tags,
            'comments': []
        })

        partitions = list()

        for tag in tags:
            partitions.append(self.partitionManager.add_partition(tag, message_id))

        message['partitions'] = partitions

        msg = Message(message_dir=self.message_dir, id=message_id, message=message)
        self.messages_dict[str(message_id)] = msg
        msg.save()


    def comment_message(self, id:str, text:str, files=[], refer='', refer_id=''):
        msg = self.messages_dict.get(id)
        if msg:
            comment = msg.comment(text, files, refer=refer, refer_id=refer_id)

            return {'success': True, "comment":comment}

        return {'success': False, 'error': '留言不存在。'}


    def like_message(self, id:str, like_list:list):
        msg = self.messages_dict.get(id)
        if msg:
            if not id in like_list:
                msg.like()
                return {'success': True, 'likes': msg.info['likes'], 'action': 'like'}
            else:
                msg.like_cancel()
                return {'success': True, 'likes': msg.info['likes'], 'action': 'cancel'}

        return {'success': False, 'error': '留言不存在。'}

    def dislike_message(self, id:str, dislike_list:list):
        msg = self.messages_dict.get(id)
        if msg:
            if not id in dislike_list:
                msg.dislike()

                return {'success': True, 'action': 'dislike'}
            else:
                msg.dislike_cancel()

                return {'success': True, 'action': 'cancel'}
        return {'success': False, 'error': '留言不存在。'}

    def get_hot_messages(self, like_list=[], dislike_list=[]):
        hot_messages = self.deal_with_messages(self.hot_messages, like_list, dislike_list)
        return hot_messages
    

    def get_messages(self, like_list, dislike_list, sort='newest', word='', filter=''):
        messages = self.search_messages(self.messages_list, word)
        messages = self.filter_messages(messages, filter)
        messages = self.sort_messages(messages, sort)
        messages = self.deal_with_messages(messages, like_list, dislike_list)
        return messages

    def get_messages_in_range(self, start_id:int, end_id:int, like_list=[], dislike_list=[]):
        ids = range(start_id, end_id)
        message_ids = os.listdir(self.message_dir)
        messages = []
        for message_id in ids:
            if str(message_id) in message_ids:
                messages.append(self.get_message(str(message_id), like_list=like_list, dislike_list=dislike_list))
        return messages

    def search_messages(self, messages, word):
        if word:
            messages = [msg for msg in messages if (word.lower() in msg['text'].lower()) or (word.lower() == str(msg['id']))]
        return messages
    
    def filter_messages(self, messages, filter_critical):
        if filter_critical == 'files':
            messages = [msg for msg in messages if msg['files']]
        return messages

    def sort_messages(self, messages, sort):
        messages.sort(key=lambda x: x['timestamp'], reverse=True)
        if sort == 'likes':
            messages.sort(key=lambda x: x['likes'], reverse=True)
        elif sort == 'dislikes':
            messages.sort(key=lambda x: x['dislikes'],reverse=True)
        return messages 

    def deal_with_messages(self, messages, like_list, dislike_list):
        for message in messages:
            if str(message['id']) in like_list:
                message['liked'] = 1
            else:
                message['liked'] = 0
            if str(message['id']) in dislike_list:
                message['disliked'] = 1
            else:
                message['disliked'] = 0
        return messages
    
    def delete_message(self, id):
        message = self.messages_dict.get(id)
        if message:
            message.destroy()
            self.messages_dict.pop(id)
            self.messages_list = self.get_all_messages_list()
            return {'success': True, 'message': '删除成功。'}
        return {'success': False, 'message': '消息不存在或已被删除'}
    
    def delete_comment(self, message_id, comment_id):
        message = self.messages_dict.get(message_id)
        if message:
            message.delete_comment(comment_id)
            return {'success': True, 'message': '评论删除成功。'}
        return {'success': False, 'message': '消息不存在或已被删除'}


    def create_id(self):
        id = random.randint(1000000, 9999999)
        while id in self.messages_dict:
            id = random.randint(1000000, 9999999)
        return id
    
    def get_tags(self):
        return self.partitionManager.get_tags()
    
    def score_message(self, message):
        score = 0
        score += (message['likes'] - message['dislikes'])*10
        score += len(message['files'])*5
        score += len(message.get('tags', []))*2
        score += len(message['comments'])*10
        score += len(message['text'])
        try:
            score -= (datetime.now() - datetime.strptime(message['timestamp'], '%Y-%m-%d %H:%M:%S')).total_seconds()/86400
        except: pass
        return score


    def refresh_hot_messages(self):
        messages = self.messages_list

        messages.sort(key=lambda x: self.score_message(x), reverse=True)
        hot_messages = messages[:20]

        self.hot_messages = hot_messages
