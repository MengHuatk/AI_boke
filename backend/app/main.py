"""FastAPI 应用入口。

启动方式（在 backend/ 目录下）：
    uvicorn app.main:app --reload --port 8000

交互式接口文档：http://127.0.0.1:8000/docs
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    """应用工厂。测试时可以用不同配置反复创建实例。"""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="个人博客后端 API。当前以 JSON 文件为内容源，可按需替换仓储实现。",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url=f"{settings.api_prefix}/openapi.json",
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

    @app.get("/health", tags=["meta"], summary="健康检查")
    def health() -> dict[str, str]:
        """供前端探活 / 容器编排使用。"""
        return {"status": "ok", "app": settings.app_name}

    return app


app = create_app()