"""管理后台路由聚合。

登录接口放在守卫之外；其余接口在各自 router 上统一挂 require_admin。
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.admin import auth, posts, talks, uploads

admin_router = APIRouter()
admin_router.include_router(auth.router)
admin_router.include_router(posts.router)
admin_router.include_router(talks.router)
admin_router.include_router(uploads.router)
