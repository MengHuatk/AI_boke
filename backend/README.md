# 玻璃博客后端

FastAPI + SQLite。公开接口只读，管理接口需要登录。

## 首次启动

在 `backend/` 目录下执行：

```bash
# 1. 安装依赖
.venv/Scripts/python.exe -m pip install -r requirements.txt

# 2. 建表
.venv/Scripts/alembic upgrade head

# 3. 导入旧 JSON 内容（可重复执行，已存在的 slug 会跳过）
.venv/Scripts/python.exe scripts/import_json.py

# 4. 生成管理员密码哈希与会话密钥，把输出写进 backend/.env
.venv/Scripts/python.exe scripts/hash_password.py
```

然后在 `backend/.env` 中确认：

```dotenv
BLOG_ADMIN_ENABLED=true
BLOG_ADMIN_PASSWORD_HASH=...
BLOG_SESSION_SECRET=...
```

启动：

```bash
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

- 公开接口文档：<http://127.0.0.1:8000/docs>
- 健康检查：<http://127.0.0.1:8000/health>

## 管理后台

源码在仓库根目录的 `admin/`，是独立的 Vite 应用。

开发模式（Vite 5173，接口代理到 FastAPI 8000）：

```bash
cd admin
npm install
npm run dev
```

打开 <http://127.0.0.1:5173/>，用 `.env` 里配置的管理员密码登录。

构建后由 FastAPI 直接托管：

```bash
cd admin
npm run build
```

产物输出到 `backend/app/static/admin/`，重启后端后访问
<http://127.0.0.1:8000/admin/>。

## 数据与备份

- 文章与杂谈：`app/blog.db`（SQLite，WAL 模式）。
- 上传图片：`uploads/`。
- 站点配置与个人资料：仍为 `app/data/site.json`、`app/data/profile.json`，
  后台暂不编辑，直接改文件即可。
- 原始文章与杂谈种子：`app/data/posts.json`、`app/data/talks.json`，
  导入脚本只读不写。

备份数据库（建议先停掉后端）：

```bash
.venv/Scripts/python.exe -c "import sqlite3; s=sqlite3.connect('app/blog.db'); d=sqlite3.connect('backup.db'); s.backup(d); d.close(); s.close()"
```

## 接口边界

- 公开只读：`/api/v1/posts`、`/api/v1/talks`、`/api/v1/site`、
  `/api/v1/profile`、`/api/v1/home`、`/api/v1/tags`、`/api/v1/stats`。
  只返回已发布内容。
- 管理接口：`/api/v1/admin/*`。仅在 `BLOG_ADMIN_ENABLED=true` 时注册，
  除登录外都要求会话。
- 上传：`POST /api/v1/admin/uploads`，仅接受 JPEG / PNG / WebP / GIF，
  默认上限 5 MB。返回的 URL 以前端可访问的后端地址为前缀，由
  `BLOG_PUBLIC_BASE_URL` 控制；本地默认 `http://127.0.0.1:8000`。

## 部署提醒

管理后台默认关闭，服务默认监听本机。公网部署时保持
`BLOG_ADMIN_ENABLED=false`，只反代公开接口；需要远程管理时，先加 HTTPS，
把 `BLOG_ADMIN_COOKIE_SECURE` 设为 `true`，并考虑在反向代理层追加登录限速。
