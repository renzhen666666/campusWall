"""
工具函数模块
"""
import os
import re
import subprocess
import json
from typing import List, Tuple, Set, Optional
from datetime import datetime
from PIL import Image
from config import get_settings

settings = get_settings()


def allowed_file(filename: str) -> bool:
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in settings.ALLOWED_EXTENSIONS


def sort_files(filenames: List[str]) -> Tuple[List[str], List[str]]:
    """将文件列表按类型分类"""
    video_files = []
    image_files = []
    for file in filenames:
        if is_image_file(file):
            image_files.append(file)
        elif is_video_file(file):
            video_files.append(file)
    return image_files, video_files


def is_email(email: str) -> bool:
    """验证邮箱格式"""
    if not isinstance(email, str):
        return False
    pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    return re.match(pattern, email) is not None


def is_int_string(s: str) -> bool:
    """检查字符串是否可以转换为整数"""
    try:
        int(s)
        return True
    except (ValueError, TypeError):
        return False


def is_image_file(file: str) -> bool:
    """检查是否为图片文件"""
    image_extensions: Set[str] = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".svg"}
    return get_file_extension(file) in image_extensions


def is_video_file(file: str) -> bool:
    """检查是否为视频文件"""
    video_extensions: Set[str] = {".mp4", ".avi", ".mov", ".webm", ".ogg", ".flv", ".mkv"}
    return get_file_extension(file) in video_extensions


def get_file_extension(file: str) -> str:
    """获取文件扩展名（小写）"""
    return os.path.splitext(file.lower())[1]


def get_file_name(file: str) -> str:
    """获取文件名"""
    return os.path.basename(file)


def change_image_file_extension(path: str, file: str) -> str:
    """将图片转换为PNG格式"""
    root, _ = os.path.splitext(file)
    new_file = os.path.join(path, f"{root}.png")
    convert_to_png(os.path.join(path, file), new_file)
    return new_file


def change_video_file_extension(path: str, file: str) -> str:
    """将视频转换为MP4格式"""
    root, _ = os.path.splitext(file)
    new_file = os.path.join(path, f"{root}.mp4")
    convert_to_mp4(os.path.join(path, file), new_file)
    return new_file


def change_file_extension(path: str, file: str, new_extension: str) -> str:
    """更改文件扩展名"""
    root, _ = os.path.splitext(file)
    new_path = os.path.join(path, f"{root}.{new_extension}")
    os.rename(os.path.join(path, file), new_path)
    return f"{root}.{new_extension}"


def making_tiny_files(filenames: List[str], tiny_folder: str = "static/tiny_files"):
    """生成缩略图文件"""
    image_files, video_files = sort_files(filenames)
    upload_folder = settings.UPLOAD_FOLDER
    
    for image_file in image_files:
        resize_image(
            os.path.join(upload_folder, image_file),
            os.path.join(tiny_folder, image_file)
        )
    for video_file in video_files:
        compress_video(
            os.path.join(upload_folder, video_file),
            os.path.join(tiny_folder, video_file)
        )


def compress_video(input_file: str, output_file: str, fps: int = 24, height: int = 100) -> bool:
    """压缩视频生成缩略图"""
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
        subprocess.run(command, check=True, capture_output=True)
        print(f"Video compressed successfully: {output_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error compressing video: {e}")
        return False


def resize_image(input_path: str, output_path: str, base_height: int = 100):
    """调整图片大小生成缩略图"""
    img = Image.open(input_path)
    h_percent = (base_height / float(img.size[1]))
    w_size = int((float(img.size[0]) * float(h_percent)))
    img = img.resize((w_size, base_height), Image.LANCZOS)
    img.save(output_path)


def convert_to_png(input_path: str, output_path: Optional[str] = None) -> str:
    """将图片转换为PNG格式"""
    try:
        with Image.open(input_path) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")
            
            output = output_path or input_path
            img.save(output, 'PNG', optimize=True, quality=95)
            return output
    except Exception as e:
        return f"图片转换失败: {str(e)}"


def convert_to_mp4(input_path: str, output_path: Optional[str] = None) -> str:
    """将视频转换为MP4格式"""
    try:
        output = output_path or input_path
        command = [
            'ffmpeg',
            '-i', input_path,
            '-c:v', 'libx264',
            '-crf', '18',
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
        return f"视频转换失败: {str(e)}\n{e.stderr.decode()}"


class FileLoader:
    """文件加载器 - 用于加载和管理 JSON 文件"""
    
    def __init__(self, path: str):
        self.path = path
        self.data = []
        self._load_data()
    
    def _load_data(self):
        """加载数据"""
        if os.path.exists(self.path):
            with open(self.path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        else:
            self.data = []
    
    def save_data(self):
        """保存数据"""
        with open(self.path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=4)
    
    def append(self, item):
        """追加数据"""
        self.data.append(item)
        self.save_data()


def log_admin_data(data: str, log_path: str = "admin_log.json"):
    """记录管理员操作日志"""
    if os.path.exists(log_path):
        with open(log_path, 'r', encoding='utf-8') as f:
            admin_log = json.load(f)
    else:
        admin_log = []
    admin_log.append(data)
    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump(admin_log, f, ensure_ascii=False, indent=2)
