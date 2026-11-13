"""管理员登录、退出与登录状态。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.config import get_settings
from app.core.security import require_admin, verify_password
from app.models.schemas import AdminLoginRequest, AdminSession

router = APIRouter(prefix="/admin", tags=["admin-auth"])


@router.post("/login", response_model=AdminSession, summary="管理员登录")
def login(payload: AdminLoginRequest, request: Request) -> AdminSession:
    settings = get_settings()
    if not verify_password(payload.password, settings.admin_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误",
        )

    request.session["admin"] = True
    return AdminSession(authenticated=True)


@router.post("/logout", response_model=AdminSession, summary="管理员退出")
def logout(request: Request) -> AdminSession:
    request.session.clear()
    return AdminSession(authenticated=False)


@router.get(
    "/me",
    response_model=AdminSession,
    summary="当前登录状态",
    dependencies=[Depends(require_admin)],
)
def me() -> AdminSession:
    return AdminSession(authenticated=True)
