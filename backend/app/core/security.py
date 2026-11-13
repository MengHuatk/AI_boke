"""密码校验与会话守卫。"""

from __future__ import annotations

import bcrypt
from fastapi import HTTPException, Request, status


def hash_password(password: str) -> str:
    """生成 bcrypt 哈希，供 scripts/hash_password.py 写入 .env。"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def require_admin(request: Request) -> None:
    """管理接口统一守卫；未登录时前端会把用户带回登录页。"""
    if request.session.get("admin") is not True:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录",
        )
