"""仓储层入口。

路由通过 ``get_repository()`` 获取实现，而不是直接 new 具体类。
``get_repository`` 本身是一个 FastAPI 依赖：每次请求创建独立 Session，
请求结束后自动关闭。
"""

from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.repositories.base import (
    AdminContentRepository,
    ContentRepository,
    SlugConflictError,
)
from app.repositories.sqlite_repository import SqliteContentRepository


def get_repository(db: Session = Depends(get_db)) -> AdminContentRepository:
    """返回当前请求使用的内容仓储。"""
    settings = get_settings()
    return SqliteContentRepository(db, settings.data_dir)


__all__ = [
    "AdminContentRepository",
    "ContentRepository",
    "SlugConflictError",
    "SqliteContentRepository",
    "get_repository",
]