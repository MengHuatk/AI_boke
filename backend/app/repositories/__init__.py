"""仓储层入口。

路由通过 ``get_repository()`` 获取实现，而不是直接 new 具体类。
换数据源时只改这里的工厂函数（或改成读配置决定），调用方零改动。
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.repositories.base import ContentRepository
from app.repositories.json_repository import JsonContentRepository


@lru_cache
def get_repository() -> ContentRepository:
    """返回当前生效的内容仓储（单例）。

    后续接入数据库时的示意：

        if settings.data_backend == "postgres":
            return PostgresContentRepository(settings.database_url)
        return JsonContentRepository(settings.data_dir)
    """
    settings = get_settings()
    return JsonContentRepository(settings.data_dir)


__all__ = ["ContentRepository", "JsonContentRepository", "get_repository"]