# 龙高校园墙 FastAPI 后端

这是龙高校园墙的 FastAPI 版本后端，从 Flask 版本迁移而来。

## 功能特性

- 消息墙功能（发帖、评论、点赞、踩）
- 文件上传（支持分片上传和直接上传）
- 管理员后台
- 用户系统基础框架
- 公告系统
- 举报系统

## 技术栈

- FastAPI 0.104+
- Uvicorn
- SQLite (消息存储)
- Pillow (图片处理)
- FFmpeg (视频处理)

## 安装

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

## 配置

1. 复制 `.env.example` 为 `.env`
2. 配置必要的环境变量

## 运行

```bash
# 直接运行
python app.py

# 或使用 uvicorn
uvicorn app:app --host 0.0.0.0 --port 5412 --reload

# Windows 下可使用启动脚本
start.bat
```

## API 端点

### 消息相关
- `GET /api/get_messages` - 获取消息列表
- `POST /api/get_message_details/{message_id}` - 获取消息详情
- `POST /api/wall/submit` - 提交新消息
- `POST /api/wall/like/{message_id}` - 点赞
- `POST /api/wall/dislike/{message_id}` - 踩
- `POST /api/wall/comment/{message_id}` - 评论

### 文件上传
- `POST /api/chunked_upload` - 分片上传
- `POST /api/merge_chunks` - 合并分片
- `POST /api/direct_upload` - 直接上传

### 管理员
- `GET /admin` - 管理员主页
- `GET /admin/login` - 登录页面
- `POST /admin/login` - 登录处理
- `POST /admin/delete_message/{school}/{message_id}` - 删除消息

### 其他
- `GET /health` - 健康检查
- `POST /api/notice` - 获取公告
- `POST /api/get_tags` - 获取标签

## 与 Flask 版本的差异

1. 使用 FastAPI 替代 Flask
2. 使用 Pydantic 进行数据验证
3. 使用异步处理提高性能
4. 使用 lifespan 管理应用生命周期
5. 路由组织更加模块化

## 注意事项

- 默认端口为 5412（Flask 版本为 5411）
- 需要安装 FFmpeg 用于视频处理
- 静态文件目录为 `static/`
