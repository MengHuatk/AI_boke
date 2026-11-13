"""FastAPI 应用入口。

启动方式（在 backend/ 目录下）：
    uvicorn app.main:app --reload --port 8000

交互式接口文档：http://127.0.0.1:8000/docs
"""

from __future__ import annotations

import warnings

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1.admin.router import admin_router
from app.api.v1.router import api_router
from app.core.config import BASE_DIR, get_settings


def create_app() -> FastAPI:
    """应用工厂。测试时可以用不同配置反复创建实例。"""
    settings = get_settings()

    # 管理后台开启前必须配好密码与签名密钥；缺任何一项都直接拒绝启动，
    # 避免出现“以为有登录，实际会话不可用”的半配置状态。
    if settings.admin_enabled:
        if not settings.admin_password_hash:
            raise RuntimeError(
                "BLOG_ADMIN_ENABLED=true 时必须配置 BLOG_ADMIN_PASSWORD_HASH。"
                "可运行 python scripts/hash_password.py 生成。"
            )
        if len(settings.session_secret) < 32:
            raise RuntimeError(
                "BLOG_ADMIN_ENABLED=true 时 BLOG_SESSION_SECRET 至少需要 32 个字符。"
            )

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="个人博客后端 API。文章与杂谈存 SQLite，站点配置仍读取 JSON。",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url=f"{settings.api_prefix}/openapi.json",
    )

    if settings.admin_enabled:
        app.add_middleware(
            SessionMiddleware,
            secret_key=settings.session_secret,
            session_cookie="admin_session",
            max_age=settings.admin_session_max_age,
            same_site="strict",
            https_only=settings.admin_cookie_secure,
        )

    # 前端与后端分端口运行，必须显式放行来源。
    # 允许的地址来自 BLOG_CORS_ORIGINS，不在代码里写死。
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_prefix)

    if settings.admin_enabled:
        app.include_router(admin_router, prefix=settings.api_prefix)

    # 上传图片需要被公开站点读取，因此不随管理后台开关一起关闭。
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount(
        settings.upload_url_prefix,
        StaticFiles(directory=settings.upload_dir),
        name="uploads",
    )

    if settings.admin_enabled:
        admin_dir = BASE_DIR / "app" / "static" / "admin"
        if admin_dir.is_dir():
            # HashRouter 让前端路由都留在 # 后面，这里只需要托管静态文件
            app.mount("/admin", StaticFiles(directory=admin_dir, html=True), name="admin")
        else:
            warnings.warn(
                f"管理后台构建产物不存在: {admin_dir}。"
                "在 admin/ 目录运行 npm run build 后再重启后端。",
                RuntimeWarning,
                stacklevel=2,
            )

    @app.get("/health", tags=["meta"], summary="健康检查")
    def health() -> dict[str, str]:
        """供前端探活 / 容器编排使用。"""
        return {"status": "ok", "app": settings.app_name}

    return app


app = create_app()