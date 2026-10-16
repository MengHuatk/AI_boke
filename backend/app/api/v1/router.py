"""v1 路由聚合。

新增业务模块时，在这里挂上子路由即可，main.py 不需要改动。
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import posts, site, tags

api_router = APIRouter()
api_router.include_router(site.router)
api_router.include_router(posts.router)
api_router.include_router(tags.router)