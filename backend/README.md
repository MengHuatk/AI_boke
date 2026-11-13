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

# 4. 导入照片集、项目、友链、音乐与生活动态示例（可重复执行，已存在的记录会跳过）
.venv/Scripts/python.exe scripts/import_frontend_content.py

# 5. 生成管理员密码哈希与会话密钥，把输出写进 backend/.env
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
- 照片集、照片、项目、友链、音乐曲目与生活动态：同样存 `app/blog.db`。
  音乐歌词存在 `music_tracks.lyrics`，生活动态的配图与位置存在
  `moments.images`、`moments.location`，都是 JSON 整段保存。
- 上传图片：`uploads/images/`；上传音频：`uploads/audio/`。
- 站点配置与个人资料：仍为 `app/data/site.json`、`app/data/profile.json`，
  后台暂不编辑，直接改文件即可。说说卡片的作者姓名与头像来自个人资料。
- 原始文章与杂谈种子：`app/data/posts.json`、`app/data/talks.json`，
  导入脚本只读不写。
- 照片集、项目、友链、音乐与生活动态种子：`app/data/photo_albums.json`、
  `app/data/projects.json`、`app/data/friend_links.json`、
  `app/data/music_tracks.json`、`app/data/moments.json`，导入脚本只读不写。
  音乐种子中的音频与封面路径仍指向前端 `frontend/public` 下的既有文件，
  生活动态配图同样引用 `/images/backgrounds/*`；后台新上传的素材保存到
  `backend/uploads/`。

备份数据库（建议先停掉后端）：

```bash
.venv/Scripts/python.exe -c "import sqlite3; s=sqlite3.connect('app/blog.db'); d=sqlite3.connect('backup.db'); s.backup(d); d.close(); s.close()"
```

## 接口边界

- 公开只读：`/api/v1/posts`、`/api/v1/talks`、`/api/v1/albums`、
  `/api/v1/projects`、`/api/v1/links`、`/api/v1/music`、`/api/v1/moments`、
  `/api/v1/site`、`/api/v1/profile`、`/api/v1/home`、`/api/v1/tags`、
  `/api/v1/stats`。只返回已发布内容。
- 管理接口：`/api/v1/admin/*`。仅在 `BLOG_ADMIN_ENABLED=true` 时注册，
  除登录外都要求会话。文章、杂谈、照片集、项目、友链、音乐、生活动态
  都支持列表、详情、新建、更新与删除。
- 上传：`POST /api/v1/admin/uploads`，仅接受 JPEG / PNG / WebP / GIF，
  默认上限 5 MB。`POST /api/v1/admin/uploads/audio` 接受 MP3 / M4A / WAV /
  OGG / FLAC / AAC，默认上限 30 MB，可用 `BLOG_AUDIO_UPLOAD_MAX_BYTES`
  调整。两者都返回 `/uploads/...` 相对路径；公开站通过 Next 的
  `/uploads/:path*` rewrite 代理到 FastAPI，管理端的 Vite dev server
  也代理同一路径。

## 部署提醒

管理后台默认关闭，服务默认监听本机。公网部署时保持
`BLOG_ADMIN_ENABLED=false`，只反代公开接口；需要远程管理时，先加 HTTPS，
把 `BLOG_ADMIN_COOKIE_SECURE` 设为 `true`，并考虑在反向代理层追加登录限速。
