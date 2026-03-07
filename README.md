# 龙高校园墙 - Vue 前端 + Flask 后端

这是龙高校园墙的现代化版本，使用 Vue 3 作为前端框架，Flask 作为后端 API 服务。

## 项目结构

```
vue-longgaowall/
├── backend/           # FastAPI 后端 API 服务
│   └── app.py        # FastAPI 应用主文件
├── frontend/         # Vue 3 前端应用
│   ├── src/
│   │   ├── components/  # Vue 组件
│   │   ├── views/       # 页面视图
│   │   ├── services/    # API 服务
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── pymongoddb/       # MongoDB 数据库 API 
```

## 功能特性

- ✅ 现代化的 Vue 3 + Vite 前端架构
- ✅ 响应式设计，支持移动端
- ✅ 留言发布、评论、点赞/点踩
- ✅ 文件上传（图片、视频、音频）
- ✅ 标签和分区功能
- ✅ 搜索和筛选
- ✅ 管理员后台
- ✅ 帮助和举报系统
- ✅ 应用广场

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.11+
- MongoDB（可选，用于 pymongoddb）

### 安装依赖

#### 前端

```bash
cd frontend
npm install
```

#### 后端

```bash
cd backend
pip install -r requirements.txt
```

### 运行开发环境

#### 启动前端开发服务器

```bash
cd frontend
npm run dev
```


#### 启动后端 API 服务器

```bash
cd backend
python app.py
```

## 配置

### 环境变量

在 `frontend` 目录下创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STATIC_URL=/static/
```

### 后端配置

编辑 `backend/app.py` 修改以下配置：

- CORS 配置
- API 端点

编辑 `backend/pymongoddb/.env` 修改以下配置：

- MongoDB api配置(具体见pymongoddb/)
- smtp 配置

### 使用 pymongoddb MongoDB API

1. 确保 MongoDB 服务正在运行
2. 配置 `pymongoddb/.env` 文件
3. 启动 pymongoddb 服务：
   ```bash
   cd pymongoddb
   python run.py
   ```
4. 在 `backend/app.py` 中集成 pymongoddb API


## API 文档

主要 API 端点：

- `GET /api/get_messages` - 获取留言列表
- `GET /api/get_hot_messages` - 获取热门留言
- `POST /api/get_message_details/<id>` - 获取留言详情
- `POST /wall/submit` - 提交留言
- `POST /wall/like/<id>` - 点赞
- `POST /wall/dislike/<id>` - 点踩
- `POST /wall/comment/<id>` - 评论
- `POST /api/chunked_upload` - 分片上传
- `POST /api/merge_chunks` - 合并文件
- `POST /api/direct_upload` - 直接上传


### 创建Dockerfile
```dockerfile
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./static
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

