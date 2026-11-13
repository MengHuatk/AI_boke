"""友链公开只读接口。"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.schemas import FriendLink
from app.repositories import ContentRepository, get_repository

router = APIRouter(prefix="/links", tags=["links"])


@router.get("", response_model=list[FriendLink], summary="友链列表")
def list_friend_links(
    repo: ContentRepository = Depends(get_repository),
) -> list[FriendLink]:
    return repo.list_friend_links()
