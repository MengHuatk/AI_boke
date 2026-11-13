"""SQLAlchemy 声明式基类。

Alembic 通过 ``Base.metadata`` 发现所有表，因此模型必须在
``app.db.models`` 里导入一次（见 migrations/env.py）。
"""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
