# Glass Notes · 个人博客

毛玻璃（glassmorphism）风格的个人博客。**初版仅完成首页**，架构按可扩展方式搭建。

```
AI_project/
├── frontend/      Next.js + React 19 + Tailwind CSS 4 + TypeScript
├── backend/       Python + FastAPI（内容以 JSON 为源，可替换为数据库）
└── docs/
    └── HANDOVER.md   交接文档（先读这个）
```

## 快速开始

需要 **Node.js ≥ 20** 与 **Python ≥ 3.10**。

### 1. 启动后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS / Linux: source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

接口文档：<http://127.0.0.1:8000/docs>

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

打开 <http://localhost:3000>。

> 前端内置了本地兜底数据：**后端没启动时首页依然能正常渲染**，
> 便于单独调试样式。后端一旦可访问，会自动切换到真实接口。

## 配置

前后端配置均通过环境变量注入，代码中不写死。

| 位置 | 文件 | 说明 |
| --- | --- | --- |
| 前端 | `frontend/.env.local` | 参照 `frontend/.env.example` |
| 后端 | `backend/.env` | 参照 `backend/.env.example` |

最常改的两个：

- `NEXT_PUBLIC_API_BASE_URL` —— 前端请求的后端地址，默认 `http://127.0.0.1:8000/api/v1`
- `BLOG_CORS_ORIGINS` —— 后端允许的前端来源

## 内容放在哪

博客内容（站点信息、个人资料、文章）目前存放在 `backend/app/data/*.json`：

| 文件 | 作用 |
| --- | --- |
| `site.json` | 站点标题、导航项、社交链接 |
| `profile.json` | 头像、头衔、简介、技能标签 |
| `posts.json` | 文章列表（含正文） |

标签与统计数字由文章**自动推导**，不需要手动维护。

改完 JSON 后重启（或 `--reload` 下自动重载）后端即可看到变化。

## 文档

- [docs/HANDOVER.md](docs/HANDOVER.md) —— 交接文档：架构、约定、如何扩展新页面