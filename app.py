from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_from_directory, make_response
import requests
import subprocess
from moviepy.video.fx import * 
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from PIL import Image
from user_agents import parse
import uuid
import shutil
import random
import json
import time
import os
import re


app = Flask(__name__, static_folder='static')
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav', 'avi', 'mp4', 'mov', 'm4a', 'webm', 'aac', 'flac', 'mid', 'apk'}
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
app.config['lg_messages_path'] = os.path.join('static', 'messages')
app.config['deleted_messages_path'] = 'deleted_messages'
app.secret_key = "5rGq5LuB5ZyzLeihqOeZveWimQ=="

app.config['CHUNK_FOLDER'] = os.path.join('static', 'chunks')
os.makedirs(app.config['CHUNK_FOLDER'], exist_ok=True)

#app.config['static_url'] = 'https://static.wangrenzhen.dpdns.org/wall/'
app.config['static_url'] = '/static/'
app.config['jscss_url'] = '/static/'

#app.config['static_url'] = 'http://127.0.0.1:619/static/'
#app.config['jscss_url'] = 'http://127.0.0.1:619/static/'


from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1)


from datetime import datetime
from collections import deque
from threading import Lock, Thread

request_records = {}
request_records_lock = Lock()


from meeting_manage import MeetingManager
from message import *

Meeting_manager = MeetingManager() 
MessageManager = MessageManager(app.config['lg_messages_path'])



from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=70)


from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    app=None
)


import logging
from logging.handlers import RotatingFileHandler

import atexit


from mail import MailSender

smtp_server = "smtp.share-email.com"
smtp_port = 465
sender_email = "admin@rz101.com"
email_sender_password = "mail@wang2010"

EmailSender = MailSender(smtp_server, smtp_port, sender_email, email_sender_password)

from flask_cors import CORS

CORS(app, 
     origins=['http://localhost:5000'],
     methods=['GET', 'POST'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)



class FileLoader:
    def __init__(self, path):
        self.path = path
        with open(path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)

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

    def append(self, item):
        self.data.append(item)
        self.save_data()


Notices = FileLoader(os.path.join('static', 'notice.json'))

MESSAGE_PAGE_SIZE = 15


class InfoFilter(logging.Filter):
    def filter(self, record):
        return record.levelno == logging.INFO

class WarningFilter(logging.Filter):
    def filter(self, record):
        return record.levelno == logging.WARNING

class ErrorFilter(logging.Filter):
    def filter(self, record):
        return record.levelno >= logging.ERROR


def setup_logging():
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # 清除现有处理器
    for handler in app.logger.handlers[:]:
        app.logger.removeHandler(handler)
    
    # info.log 处理器
    info_handler = RotatingFileHandler('logs/info.log', maxBytes=1024*1024*15, backupCount=10)
    info_handler.setLevel(logging.INFO)
    info_handler.addFilter(InfoFilter())
    info_formatter = logging.Formatter('[%(asctime)s] INFO: %(message)s')
    info_handler.setFormatter(info_formatter)
    
    # wrong.log 处理器
    wrong_handler = RotatingFileHandler('logs/wrong.log', maxBytes=1024*1024*15, backupCount=10)
    wrong_handler.setLevel(logging.WARNING)
    wrong_handler.addFilter(WarningFilter())
    wrong_formatter = logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s [%(pathname)s:%(lineno)d]')
    wrong_handler.setFormatter(wrong_formatter)
    
    # error.log 处理器
    error_handler = RotatingFileHandler('logs/error.log', maxBytes=1024*1024*15, backupCount=10)
    error_handler.setLevel(logging.ERROR)
    error_handler.addFilter(ErrorFilter())
    error_formatter = logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s [%(pathname)s:%(lineno)d]')
    error_handler.setFormatter(error_formatter)
    
    app.logger.addHandler(info_handler)
    app.logger.addHandler(wrong_handler)
    app.logger.addHandler(error_handler)
    app.logger.setLevel(logging.INFO)

@app.after_request
def after_request(response):
    if 400 <= response.status_code < 500:
        app.logger.warning(f'{response.status_code} {request.method} {request.url}')
        return make_response(render_template('error.html', continue_url='/', h1_text=f"出现了一个错误"), response.status_code)
    elif 500 <= response.status_code < 600:
        app.logger.error(f'{response.status_code} {request.method} {request.url}')
        return make_response(render_template('error.html', continue_url='/', h1_text=f"出现了一个错误"), response.status_code)
    elif 200 <= response.status_code < 400:
        app.logger.info(f'{response.status_code} {request.method} {request.url}')
    return response

@app.before_request
def before_request():
    if request.endpoint not in ['static', 'static_tiny', 'css', 'js']:
        if not session.get("likes", ''):
            session['likes'] = []
        if not session.get("dislikes", ''):
            session['dislikes'] = []


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/img/<filename>')
def send_img(filename):
    return send_from_directory(os.path.join('static', 'img'), filename)

@app.route('/css/<filename>')
def send_css(filename):
    return send_from_directory('static/css', filename)

@app.route('/js/<filename>')
def send_js(filename):
    return send_from_directory('static/js', filename)

@app.route('/static/tiny_files/<filename>', methods=['GET'])
def static_tiny(filename):
    if os.path.exists(os.path.join('static', 'tiny_files', filename)):
        return send_from_directory(os.path.join('static', 'tiny_files'), filename)
    else:
        if os.path.exists(os.path.join('static', 'uploads', filename)):
            return send_from_directory(os.path.join('static', 'uploads'), filename)
        return send_from_directory('static', 'loading.mp4')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html', static_url=app.config['static_url'], jscss_url=app.config['jscss_url'])
@app.route('/api/get_messages', methods=['GET'])
def messages():
    sort = request.args.get('s', "newest", type=str)
    word = request.args.get('w', '', type=str)
    filter_critical = request.args.get('f', 'all', type=str)
    start_range = request.args.get('start', 0, type=int)
    end_range = request.args.get('end', 10, type=int)

    messages = MessageManager.get_messages(
        like_list=session.get(f'like', []),
        dislike_list=session.get(f'dislike', []),
        sort=sort,
        word=word,
        filter=filter_critical
        )
    

    paginated_messages = messages[start_range:end_range]

    return jsonify({
        "data": paginated_messages,
        "total": len(messages),
    })

@app.route('/api/notice', methods=['POST'])
def api_get_notice():
    return jsonify({"success": True, "content": Notices.data})

@app.route('/api/get_page_size', methods=['GET'])
def api_get_page_size():
    return jsonify({"page_size": MESSAGE_PAGE_SIZE})

@app.route('/api/get_all_messages', methods=['GET'])
def api_get_all_messages():
    messages = MessageManager.get_all_messages_list()
    return jsonify(messages)

@app.route('/api/get_message_details/<message_id>', methods=['POST'])
def get_message_details(message_id):
    message = MessageManager.get_message(message_id, like_list=session.get(f'like', []), dislike_list=session.get(f'dislike', []))
    if message:
        return jsonify({'success': True, 'message': message})
    return jsonify({'success': False, 'error': '消息不存在'})

@app.route('/api/get_message_partitions/<message_id>', methods=['POST'])
def get_message_partition(message_id):
    message = MessageManager.get_message(message_id, like_list=session.get(f'like', []), dislike_list=session.get(f'dislike', []))
    if message:
        return jsonify({'success': True, 'partition': message.get('tags', [])})
    return jsonify({'success': False, 'error': '消息不存在'})

@app.route('/api/get_tags', methods=['POST'])
def api_get_tags():
    return jsonify(list(MessageManager.get_tags()))

@app.route('/api/get_partition_messages', methods=['POST'])
def api_get_partition_messages():
    data = request.get_json()
    partition = data.get('partition', '')
    return jsonify({"success": True, "data": MessageManager.get_tags_message_ids(partition)})

@app.route('/api/get_message_list', methods=['POST'])
def api_get_message_list():
    return jsonify(MessageManager.get_messages_list())

@app.route('/api/get_hot_messages', methods=['GET'])
def api_get_hot_messages():
    return jsonify({'success': True, 'messages': MessageManager.get_hot_messages(like_list=session.get('likes', []), dislike_list=session.get('dislikes', []))})

def upload_file(files, filenames):
    try:
        for i in range(len(files)):
            file = files[i]
            filename = filenames[i]
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            if files[i].content_length > 10*1024*1024:
                executor.submit(making_tiny_files, [filename])
    except:
        pass

@app.route('/api/apps', methods=['POST'])
def api_apps():
    apps = list()
    for app in os.listdir(os.path.join('static', 'apps')):
        with open(os.path.join('static', 'apps', app, 'config.json'), 'r', encoding='utf-8') as f:
            config = json.load(f)
            apps.append(config)

    return jsonify({"success": True, "apps": apps})


@app.route('/wall/comment/<message_id>', methods=['POST'])
def comment_message(message_id):
    refer = request.form.get('refer', '')
    refer_id = request.form.get('refer_id', '')
    comment_text = request.form.get('text')
    if not comment_text:
        return jsonify({'success': False, 'error': '输入不能为空'})

    files = request.files.getlist('file')

    message = MessageManager.get_message(message_id)

    if message:
        result_files = list()

        for file in files:
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(f"id{message_id}_{uuid.uuid4()}_{time.time()}_{file.filename}")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)

                if is_video_file(filename):
                    filename = change_file_extension(app.config['UPLOAD_FOLDER'], filename, 'mp4')

                result_files.append(filename)
                executor.submit(making_tiny_files, [filename])
            elif file and file.filename != '':
                return jsonify({'success': False, 'error': '文件格式不支持或文件为空。'})

        return jsonify(MessageManager.comment_message(id=message_id, text=comment_text, files=result_files, refer=refer, refer_id=refer_id))
    else:
        return jsonify({'success': False, 'error': '留言不存在。'})


@app.route('/wall/like/<message_id>', methods=['POST'])
def like_message(message_id:str):

    result = MessageManager.like_message(id=message_id, like_list=session.get('likes', []))


    if result['success']:
        if result['action'] == 'like':
            session['likes'] = session.get('likes', []) + [message_id]
        elif result['action'] == 'cancel':
            session['likes'] = session.get('likes', []).remove(message_id)
        return jsonify(result)
    return jsonify(result)

@app.route('/wall/dislike/<message_id>', methods=['POST'])
def dislike_message(message_id:str):

    result = MessageManager.dislike_message(id=message_id, dislike_list=session.get('dislikes', []))

    if result['success']:
        if result['action'] == 'dislike':
            session['dislikes'] = session.get('dislikes', []) + [message_id]
        elif result['action'] == 'cancel':
            session['dislikes'] = session.get('dislikes', []).remove(message_id)
        return jsonify(result)
    return jsonify(result)


@app.route('/wall/submit', methods=['POST'])
def wall_submit():
    text = request.form.get('text')
    filenames = request.form.getlist('filenames')
    tag = request.form.get('tags', '')

    tags = [t for t in list(tag.split(',')) if t != '']
    
    if not text and not filenames:
        return jsonify({'success': False, "error": "输入不能为空"})
    
    #try:

    valid_files = []
    for filename in filenames:
        if allowed_file(filename) and os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
            valid_files.append(filename)


    MessageManager.post_message(text=text, files=valid_files, tags=tags)
    

    for filename in valid_files:
        if not os.path.exists(os.path.join("static/tiny_files", filename)):
            executor.submit(making_tiny_files, [filename])

    return jsonify({'success': True})
    #except Exception as e:
    #    app.logger.error("留言失败：" + str(e))
    #    return jsonify({'success': False, 'error': f'留言失败：{str(e)}'})

@app.route('/apps', methods=['GET'])
def apps():
    return render_template('apps.html')

@app.route('/wall', methods=['GET'])
def wall_main():
    sort = request.args.get('s', 'newest', type=str)
    word = request.args.get('w', '', type=str)
    filter_critical = request.args.get('f', '', type=str)
    if word:
        return render_template('wall.html', static_url=app.config['static_url'], jscss_url=app.config['jscss_url'], defaultSort=sort, search_word=word, defaultFilter=filter_critical, search_result=f"找到以下有关'{word}'的{len(messages)}条内容")
    return render_template('wall.html', static_url=app.config['static_url'], jscss_url=app.config['jscss_url'], defaultSort=sort, defaultFilter=filter_critical)


@app.route('/wall/message/<message_id>')
def message_detail(message_id):
    message = MessageManager.get_message(message_id, like_list=session.get('likes', []), dislike_list=session.get('dislikes', []))

    if message:
        return render_template('message_detail.html', static_url=app.config['static_url'], jscss_url=app.config['jscss_url'], message=message)
    else:
        flash('留言不存在。')
        return redirect('/wall')

@app.route('/p', methods=['GET'])
def partition():
    return render_template('partition.html', static_url=app.config['static_url'], jscss_url=app.config['jscss_url'], tag='')

@app.route('/p/<tag>', methods=['GET'])
def partition_tag(tag):
    return render_template('partition.html', static_url=app.config['static_url'], jscss_url=app.config['jscss_url'],
            tag=tag,
            partition={
                "name": tag
            }
    )


# 分片上传接口
@app.route('/api/chunked_upload', methods=['POST'])
def chunked_upload():
    try:
        chunk = request.files['chunk']
        chunk_index = int(request.form['chunkIndex'])
        total_chunks = int(request.form['totalChunks'])
        file_key = request.form['fileKey']
        original_name = request.form['originalName']

        if not allowed_file(original_name):
            return jsonify({'success': False, 'error': f'文件格式不允许'})
        
        # 创建文件标识符目录
        file_dir = os.path.join(app.config['CHUNK_FOLDER'], file_key)
        os.makedirs(file_dir, exist_ok=True)
        
        # 保存分片
        chunk.save(os.path.join(file_dir, f"{chunk_index:05d}_{chunk.filename}"))
        
        # 记录上传状态
        uploaded_chunks = len(os.listdir(file_dir))


        with open(os.path.join(file_dir, 'metadata.json'), 'w') as f:
            json.dump({
                'original_name': original_name,
                'total_chunks': total_chunks,
                'timestamp': time.time()
            }, f)
        
        
        return jsonify({
            'success': True,
            'uploadedChunks': uploaded_chunks,
            'totalChunks': total_chunks
        })
    except Exception as e:
        app.logger.error(f"分片上传失败: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

# 合并文件接口
@app.route('/api/merge_chunks', methods=['POST'])
def merge_chunks():
    try:
        data = request.get_json()
        file_key = data['fileKey']
        
        chunk_dir = os.path.join(app.config['CHUNK_FOLDER'], file_key)
        if not os.path.exists(chunk_dir):
            return jsonify({'success': False, 'error': '分片目录不存在'})
        
        # ✅ 从元数据获取总分片数
        with open(os.path.join(chunk_dir, 'metadata.json')) as f:
            metadata = json.load(f)
        
        # ✅ 安全获取分片文件
        chunk_files = sorted(
            [f for f in os.listdir(chunk_dir) if re.match(r'^\d{5}_', f)],
            key=lambda x: int(re.match(r'^(\d{5})_', x).group(1))
        )
        
        expected_chunks = metadata['total_chunks']  # ✅ 使用元数据中的准确值
        
        # ✅ 验证分片完整性
        if len(chunk_files) != expected_chunks:
            return jsonify({
                'success': False, 
                'error': f'分片不完整，缺少{expected_chunks - len(chunk_files)}个分片'
            })
        
        # ✅ 生成更安全的文件名
        filename = secure_filename(f"{uuid.uuid4()}_{metadata['original_name']}")
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # ✅ 安全合并分片
        with open(upload_path, 'wb') as output_file:
            for chunk in chunk_files:
                with open(os.path.join(chunk_dir, chunk), 'rb') as input_file:
                    shutil.copyfileobj(input_file, output_file)
                os.remove(os.path.join(chunk_dir, chunk))
    
        if is_image_file(filename) and get_file_extension(filename) != '.png':
            change_image_file_extension(app.config['UPLOAD_FOLDER'], filename)
        #elif is_video_file(filename) and get_file_extension(filename) != '.mp4':
        #    change_video_file_extension(app.config['UPLOAD_FOLDER'], filename)

        thread_making_tiny_file = Thread(target=making_tiny_files, args=(filename,))
        thread_making_tiny_file.start()

        # ✅ 清理元数据
        os.remove(os.path.join(chunk_dir, 'metadata.json'))
        os.rmdir(chunk_dir)
        
        return jsonify({'success': True, 'filenames': [filename]})
    except Exception as e:
        app.logger.error(f"合并文件失败: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/direct_upload', methods=['POST'])
def direct_upload():
    try:
        file = request.files['file']
        original_name = request.form['originalName']

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': '文件类型不支持'})

        # 保存完整文件
        filename = secure_filename(f"{uuid.uuid4()}_{original_name}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # 图片格式转换
        if is_image_file(filename) and get_file_extension(filename) != '.png':
            change_image_file_extension(app.config['UPLOAD_FOLDER'], filename)
        elif is_video_file(filename) and get_file_extension(filename) != '.mp4':
            change_video_file_extension(app.config['UPLOAD_FOLDER'], filename)

        # 异步生成缩略图
        thread_making_tiny_file = Thread(target=making_tiny_files, args=(filename,))
        thread_making_tiny_file.start()

        return jsonify({'success': True, 'filenames': [filename]})
    except Exception as e:
        app.logger.error(f"直接上传失败: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})
    
@app.route('/help', methods=['GET'])
def help():
    return render_template('help.html', static_url=app.config['static_url'])

@app.route('/help/form', methods=['GET'])
def help_get():
    title = request.args.get('ti', '帮助')
    h1 = request.args.get('h1', '您遇到了什么问题？')
    text = request.args.get('te', '')
    placeholder = request.args.get('pl', '您遇到了什么问题？')

    return render_template('help_form.html', static_url=app.config['static_url'],
        title=title, 
        text=text,
        h1=h1,
        placeholder=placeholder
    )

@app.route('/help/form', methods=['POST'])
def help_post():
    title = request.form.get('title')
    email = request.form.get('email')
    text = request.form.get('text')
    if text:
        with open(os.path.join('help', 'help.json'), "r", encoding='utf-8') as f:
            help_dict = json.load(f)

        report = {
            'id': uuid.uuid4().hex,
            'title': title,
            'email': email,
            'text': text,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        help_dict.append(report)
        with open(os.path.join('help', 'help.json'), 'w', encoding='utf-8') as f:
            json.dump(help_dict, f, ensure_ascii=False, indent=4)

        if is_email(email):
            EmailSender.send_response_email(
            recipient_email=email, 
            title="龙高校园墙 - 已收到您的反馈", 
            message={
                'report_id': report['id'],
                'timestamp': report['timestamp'],
                'content': report['text']
            })

        return redirect('/help/success')
    flash('请填写内容')
    return jsonify({'success': False, 'error': '请填写内容'})


@app.route('/help/report', methods=['GET'])
def help_report_get():
    return render_template('report_help.html', static_url=app.config['static_url'])

@app.route('/help/report/<message_id>', methods=['GET'])
def report_get(message_id):
    message = MessageManager.get_message(message_id)
    if message:
        return render_template('report.html', static_url=app.config['static_url'], message=message)
    return render_template('error.html', static_url=app.config['static_url'], h1_text='消息不存在', text='您要举报的消息不存在或已被删除')

@app.route('/help/report/<message_id>', methods=['POST'])
def help_report_post(message_id):
    text = request.form.get('text')
    email = request.form.get('email')


    category_value = request.form.get('category')
    categorys = {
        "spam": "垃圾信息",
        "abuse": "恶意行为",
        "other": "其他"
    }

    category = categorys.get(category_value, '其他')

    if text:
        with open(os.path.join('help', 'report.json'), "r", encoding='utf-8') as f:
            report_dict = json.load(f)

        report_dict[message_id] = list(report_dict.get(message_id, []))

        report = {
            'id': uuid.uuid4().hex,
            'text': text,
            'email': email,
            'category': category,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        report_dict[message_id].append(report)

        with open(os.path.join('help', 'report.json'), "w", encoding='utf-8') as f:
            json.dump(report_dict, f, ensure_ascii=False, indent=4)

        if is_email(email):
            EmailSender.send_response_email(
                recipient_email=email, 
                title="龙高校园墙 - 已收到您的举报", 
                strongtitle="您的举报：",
                message={
                    'message_id': message_id,
                    'message_category': category,
                    'report_id': report['id'],
                    'timestamp': report['timestamp'],
                    'content': report['text']
                })



    return redirect('/help/success')

@app.route('/help/success', methods=['GET'])
def success():
    return render_template('success.html')

def verify_admin(admin_name, admin_password):
    with open('managers.json', 'r', encoding='utf-8') as f:
        managers_data = json.load(f)
    manager_list = list(managers_data.keys())
    if admin_name in manager_list:
        if admin_password == managers_data[admin_name]['password']:
            return True
    return False

def get_admin_user_permissions(admin_name):
    with open('managers.json', 'r', encoding='utf-8') as f:
        managers_data = json.load(f)
    return managers_data[admin_name]['permissions']

@app.route('/admin', methods=['GET'])
def admin_main_page():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return redirect('/admin/login')
    else:
        app.logger.info(f"来自{request.remote_addr}的访问登录了{admin_user}管理员用户")
        log_admin_data(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}    来自{request.remote_addr}的访问登录了{admin_user}管理员用户")

    permissions = get_admin_user_permissions(admin_user)
    return render_template('admin.html', static_url=app.config['static_url'], username=admin_user, permissions=permissions)

@app.route('/admin/login', methods=['GET'])
def admin_login_page():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if verify_admin(admin_user, admin_password):
        return redirect('/admin')
    return render_template('admin_login.html')

@app.route('/admin/login', methods=['POST'])
def admin_login():
    admin_user = request.form.get('username')
    admin_password = request.form.get('password')
    if verify_admin(admin_user, admin_password):
        session['admin_user'] = admin_user
        session['admin_password'] = admin_password
        app.logger.info(f"来自{request.remote_addr}的访问登录了{admin_user}管理员用户")
        log_admin_data(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}    来自{request.remote_addr}的访问登录了{admin_user}管理员用户")
        return redirect('/admin')
    else:
        flash('用户名或密码错误。')
        return render_template('admin_login.html', error='用户名或密码错误。')

@app.route('/admin/logout', methods=['GET'])
def admin_logout():
    session.pop('admin_user', None)
    session.pop('admin_password', None)
    return redirect('/admin/login')
@app.route('/admin/log', methods=['GET'])
def log():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return redirect('/admin/login')

    search_query = request.args.get('search', '')
    with open('error.log', 'r') as f:
        content = f.readlines()
    for line in content:
        if "/log " in line:
            content.remove(line)
    if len(content) >1000:
        content = content[-1000:]
    if search_query:
        content = [line for line in content if search_query.lower() in line.lower()]
    return render_template('log.html', log_content=content, search_query=search_query)

@app.teardown_request
def log_after_request(exception=None):
    if exception:
        with open('error.log', 'a') as f:
            f.write(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} || {request.method} {request.url} || {str(exception)}\n")

@app.route('/admin/error_log', methods=['GET'])
def error_log():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return redirect('/admin/login')

    search_query = request.args.get('search', '')
    with open('error_log.json', 'r', encoding='utf-8') as f:
        content = json.load(f)
    for line in content:
        if "/admin/error_log " in line:
            content.remove(line)
    if len(content) >1000:
        content = content[-1000:]
    if search_query:
        content = [line for line in content if search_query.lower() in line.lower()]
    return render_template('log.html', log_content=content, search_query=search_query)

@app.route('/admin/admin_log', methods=['GET'])
def admin_log():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return redirect('/admin/login')

    search_query = request.args.get('search', '')
    with open('admin_log.json', 'r', encoding='utf-8') as f:
        content = json.load(f)
    for line in content:
        if "/admin/admin_log " in line:
            content.remove(line)
    if len(content) >1000:
        content = content[-1000:]
    if search_query:
        content = [line for line in content if search_query.lower() in line.lower()]
    return render_template('log.html', log_content=content, search_query=search_query)

@app.route('/admin/notice', methods=['GET'])
def notice_get():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return redirect('/admin/login')

    return render_template('admin_notice.html')

@app.route('/admin/notice', methods=['POST'])
def notice_post():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return redirect('/admin/login')

    notice_content = request.form.get('text', '')
    if notice_content:
        Notices.append({
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "user": f'管理员{admin_user}',
            "content": notice_content
        })
    return redirect('/admin')

@app.route('/admin/report', methods=['GET'])
def admin_report():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return redirect('/admin/login')


    with open(os.path.join('help', 'report.json'), 'r', encoding='utf-8') as f:
        reports_dict = json.load(f)

    message_ids = list()
    for report_id in reports_dict.keys():
        message_ids.append(report_id)

    return render_template('admin_report.html', message_ids=message_ids, reports=reports_dict)

@app.route('/admin/wall', methods=['GET'])
def admin_wall_main():
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return redirect('/admin/login')
    
    permissions = get_admin_user_permissions(admin_user)
    manange_school_list = [perm["sch"] for perm in permissions if perm['name'] == "manage_wall_message"]
    return render_template('admin_wall.html', manange_school_list=manange_school_list)

@app.route('/admin/delete_message/<school>/<message_id>', methods=['POST'])
def delete_message(school, message_id):
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return render_template('admin_login.html', error='请先登录')
    
    permissions = get_admin_user_permissions(admin_user)
    manange_school_list = [perm["sch"] for perm in permissions if perm['name'] == "manage_wall_message"]
    if not school in manange_school_list:
        return render_template('admin_login.html', error='你没有这个权限')
    
    try:
        result = MessageManager.delete_message(message_id)

        with open(os.path.join('help', 'report.json'), 'r', encoding='utf-8') as f:
            report_dict = json.load(f)
        if report_dict.get(message_id): del report_dict[message_id]
        with open(os.path.join('help', 'report.json'), 'w', encoding='utf-8') as f:
            json.dump(report_dict, f, indent=4, ensure_ascii=False)

        if result['success']:
            app.logger.info(f"管理员 {admin_user} 删除了龙高墙的消息 {message_id}")
            log_admin_data(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}    {admin_user}删除了龙高墙的消息 {message_id}")
        return jsonify(result)

    except Exception as e:
        app.logger.error(f"删除消息失败: {str(e)}")
        return jsonify({'success': False, 'error': '删除失败'})

@app.route('/admin/api/delete_comment/<message_id>/<comment_id>', methods=['POST'])
def delete_comment(message_id, comment_id):
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return jsonify({'success': False, 'error': '请先登录'})

    try:
        result = MessageManager.delete_comment(message_id, comment_id)
        if result['success']:
            app.logger.info(f"管理员 {admin_user} 删除了消息 {message_id} 的评论 {comment_id}")
            log_admin_data(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}    {admin_user}删除了消息 {message_id} 的评论 {comment_id}")
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"删除评论失败: {str(e)}")
        return jsonify({'success': False, 'error': '删除失败'})

@app.route('/admin/api/delete_report/<message_id>/<report_id>', methods=['POST'])
def admin_delete_reports(message_id, report_id):
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return jsonify({'success': False, 'error': '请先登录'})

    #try:
    with open(os.path.join('help', 'report.json'), 'r', encoding='utf-8') as f:
        report_dict = json.load(f)

    report = [report for report in report_dict[message_id] if report['id'] == report_id][0]

    if report:
        report_dict[message_id].remove(report)
        if not report_dict[message_id]:
            del report_dict[message_id]

        with open(os.path.join('help', 'report.json'), 'w', encoding='utf-8') as f:
            json.dump(report_dict, f, ensure_ascii=False, indent=4)

        with open(os.path.join('help', 'processed_report.json'), 'r', encoding='utf-8') as f:
            processed_report = json.load(f)

        processed_report[message_id] = processed_report.get(message_id, []).append(report)

        with open(os.path.join('help', 'processed_report.json'), 'w', encoding='utf-8') as f:
            json.dump(processed_report, f, ensure_ascii=False, indent=4)

        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': '举报不存在'})

    #except Exception as e:
    #    return jsonify({'success': False, 'error': '删除失败'})

@app.route('/admin/api/messages/<school>', methods=['GET'])
def admin_get_messages(school):
    query = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    page_size = 20
    show_all = request.args.get('show_all', 'false').lower() == 'true'

    messages = MessageManager.get_messages(like_list=session.get(f'like', []), dislike_list=session.get(f'dislike', []), word=query, filter='all')
    
    approved_ids = get_approved_ids(school)

    if not show_all:
        messages = [msg for msg in messages if int(msg['id']) not in approved_ids]

    total_pages = (len(messages) + page_size - 1) // page_size
    start = (page - 1) * page_size
    end = start + page_size
    paginated_messages = messages[start:end]

    return jsonify({
        "messages": paginated_messages,
        "total_pages": total_pages
    })

@app.route('/admin/api/get_message/<id>', methods=['GET'])
def admin_get_message(id):
    message = MessageManager.get_message(id, like_list=session.get(f'like', []), dislike_list=session.get(f'dislike', []))
    return jsonify(message)

def get_approved_ids(sch):
    with open('manage_message.json', 'r', encoding='utf-8') as f:
        manage_data = json.load(f)
    ids = manage_data['approved'].get(sch, [])
    return [int(id['id']) for id in ids]

@app.route('/admin/repair_message/<school>/<id>', methods=['POST', 'GET'])
def repair_messages(school, id):
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return jsonify({'success': False, 'error': '请先登录'})

    message = MessageManager.get_message(id, like_list=session.get(f'like', []), dislike_list=session.get(f'dislike', []))
    errors = []

    if not message:
        return jsonify({'success': False, 'error': '消息不存在'})
    
    for file in message['files']:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file)
        if not os.path.exists(file_path):
            errors.append(f"文件 {file} 不存在")
            continue
        if is_image_file(file) and get_file_extension(file) != '.png':
            new_file = change_image_file_extension(app.config['UPLOAD_FOLDER'], file)
            message['files'][message['files'].index(file)] = new_file
        elif is_video_file(file) and get_file_extension(file) != '.mp4':
            new_file = change_video_file_extension(app.config['UPLOAD_FOLDER'], file)
            message['files'][message['files'].index(file)] = new_file

    if message['files']: executor.submit(making_tiny_files, message['files'])
    try:
        with open(os.path.join(app.config[f'{school}_messages_path'], id, 'message.json'), 'w', encoding='utf-8') as f:
            json.dump(message, f, ensure_ascii=False, indent=2)
        app.logger.info(f"管理员 {admin_user} 修复了消息 {id}")
        log_admin_data(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}    {admin_user}修复了消息 {id}")
        return jsonify({'success': True, 'errors': errors})
    except Exception as e:
        app.logger.error(f"修复消息失败: {str(e)}")
        return jsonify({'success': False, 'error': '修复失败', 'details': str(e)})


@app.route('/admin/api/approved_ids/<sch>', methods=['GET'])
def api_get_approved_ids(sch):
    approved_ids = get_approved_ids(sch)
    return jsonify(approved_ids)

@app.route('/admin/approve_message/<school>/<message_id>', methods=['POST'])
def approve_message(school, message_id):
    admin_user = session.get('admin_user', '')
    admin_password = session.get('admin_password', '')
    if not verify_admin(admin_user, admin_password):
        return jsonify({'success': False, 'error': '请先登录'})

    permissions = get_admin_user_permissions(admin_user)
    manange_school_list = [perm["sch"] for perm in permissions if perm['name'] == "manage_wall_message"]
    if school not in manange_school_list:
        return jsonify({'success': False, 'error': '权限不足'})

    try:
        with open('manage_message.json', 'r', encoding='utf-8') as f:
            manage_data = json.load(f)       
            
        approved_ids = get_approved_ids(school)
        if int(message_id) in approved_ids:
            return jsonify({'success': False, 'error': '消息已审核'})
        
        manage_data['approved'][school].append({"id": int(message_id), "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),"by":admin_user})
        with open('manage_message.json', 'w', encoding='utf-8') as f:
            json.dump(manage_data, f, ensure_ascii=False, indent=2)
            
        return jsonify({'success': True})
    except Exception as e:
        app.logger.error(f"审核消息失败: {str(e)}")
        return jsonify({'success': False, 'error': '失败'})

def log_admin_data(data):
    with open('admin_log.json', 'r', encoding='utf-8') as f:
        admin_log = json.load(f)
    admin_log.append(data)
    with open('admin_log.json', 'w', encoding='utf-8') as f:
        json.dump(admin_log, f, ensure_ascii=False, indent=2)

def cleanup_function():
    print("正在关闭...")
    MessageManager.save_messages()
    print("清理完成")


def sort_files(filenames):
    video_files = []
    image_files = []

    for file in filenames:
        if is_image_file(file):
            image_files.append(file)
        elif is_video_file(file):
            video_files.append(file)

    return image_files, video_files

def is_email(email):
    if not isinstance(email, str):
        return False
    pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    return re.match(pattern, email) is not None

def is_int_string(s):
    try:
        int(s)
        return True
    except (ValueError, TypeError):
        return False

def is_image_file(file):
    image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".svg"}
    return get_file_extension(file) in image_extensions

def is_video_file(file):
    video_extensions = {".mp4", ".avi", ".mov", ".webm", ".ogg", ".flv", ".mkv"}
    return get_file_extension(file) in video_extensions

def get_file_extension(file):
    """统一获取文件扩展名"""
    if isinstance(file, str):
        return os.path.splitext(file.lower())[1]
    return os.path.splitext(file.filename.lower())[1]

def get_file_name(file):
    """统一获取文件名"""
    if isinstance(file, str):
        return os.path.basename(file)
    return os.path.basename(file.filename)

def change_image_file_extension(path, file):
    root, _ = os.path.splitext(file)
    new_file = os.path.join(path, f"{root}.png")
    convert_to_png(os.path.join(path, file), new_file)
    return new_file

def change_video_file_extension(path, file):
    root, _ = os.path.splitext(file)
    new_file = os.path.join(path, f"{root}.mp4")
    convert_to_mp4(os.path.join(path, file), new_file)
    return new_file

def change_file_extension(path, file, new_extension):
    root, _ = os.path.splitext(file)
    new_path = os.path.join(path, f"{root}.{new_extension}")
    os.rename(os.path.join(path, file), new_path)
    return f"{root}.{new_extension}"

# 图片转换函数
def convert_to_png(input_path, output_path=None):
    """将图片转换为PNG格式"""
    try:
        with Image.open(input_path) as img:
            # 处理透明通道
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")
            
            output = output_path or input_path
            img.save(output, 'PNG', optimize=True, quality=95)
            return output
    except Exception as e:
        app.logger.error(f"图片转换失败: {str(e)}")
        return None

# 视频转换函数
def convert_to_mp4(input_path, output_path=None):
    """将视频转换为MP4格式"""
    try:
        output = output_path or input_path
        command = [
            'ffmpeg',
            '-i', input_path,
            '-c:v', 'libx264',
            '-crf', '18',  # 18-23为常用无损~高质量区间，18几乎无损
            '-preset', 'veryfast',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-y',
            output
        ]
        result = subprocess.run(command, check=True, capture_output=True)
        return output
    except subprocess.CalledProcessError as e:
        app.logger.error(f"视频转换失败: {str(e)}\n{e.stderr.decode()}")
        return None

def making_tiny_files(filenames, tiny_folder="static/tiny_files"):
    image_files, video_files = sort_files(filenames)
    for image_file in image_files:
        resize_image(os.path.join(app.config['UPLOAD_FOLDER'], image_file), os.path.join(tiny_folder, image_file))
    for video_file in video_files:
        compress_video(os.path.join(app.config['UPLOAD_FOLDER'], video_file), os.path.join(tiny_folder, video_file))

def compress_video(input_file, output_file, fps=24, height=100):
    if not os.path.isfile(input_file):
        print(f"Input file does not exist: {input_file}")
        return False

    try:
        command = [
            'ffmpeg',
            '-i', input_file,
            '-vf', f'scale=-1:{height}',
            '-r', str(fps),
            '-c:v', 'libx264',
            '-crf', '20',  
            '-preset', 'fast',
            '-c:a', 'aac',
            '-b:a', '64k',
            '-movflags', '+faststart',
            '-an',
            '-y',
            output_file
        ]
        subprocess.run(command, check=True)
        print(f"Video compressed successfully: {output_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error compressing video: {e}")
        return False

def resize_image(input_path, output_path, base_height=100):
    img = Image.open(input_path)
    h_percent = (base_height / float(img.size[1]))
    w_size = int((float(img.size[0]) * float(h_percent)))
    img = img.resize((w_size, base_height), Image.LANCZOS)
    img.save(output_path)


if __name__ == '__main__':
    app.logger.handlers.clear()
    setup_logging()

    #atexit.register(cleanup_function)

    try:
        app.run(
            debug=False,
            port=541,
            threaded=True,
            host='0.0.0.0'
        )
    except KeyboardInterrupt:
        print("\n接收到中断信号，正在关闭服务器...")