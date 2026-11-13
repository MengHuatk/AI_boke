"""看板娘对话接口。"""

from __future__ import annotations

import logging
from collections import defaultdict, deque
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import get_settings
from app.models.schemas import ChatReply, ChatRequest
from app.services.anon_chat import generate_reply

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)

# 单进程内存限流：每个 IP 一分钟内最多 N 次。
# 多 worker / 多实例部署时每个进程各自计数，需要全局配额时换成 Redis。
_request_log: dict[str, deque[float]] = defaultdict(deque)


def check_rate_limit(request: Request) -> None:
    settings = get_settings()
    ip = request.client.host if request.client else "unknown"
    now = monotonic()
    log = _request_log[ip]

    while log and now - log[0] > 60:
        log.popleft()

    if len(log) >= settings.ai_rate_limit_per_minute:
        raise HTTPException(status_code=429, detail="请求太频繁了，稍后再试")

    log.append(now)


@router.post("/chat", response_model=ChatReply, summary="看板娘对话")
async def chat(
    payload: ChatRequest,
    _: None = Depends(check_rate_limit),
) -> ChatReply:
    """把用户这一轮和最近几轮历史交给 AI，返回回答和情绪。"""
    settings = get_settings()
    if not settings.ai_api_key:
        raise HTTPException(status_code=503, detail="AI 尚未配置")

    try:
        return await generate_reply(payload.message, payload.history)
    except OSError as error:
        # 上游超时、DNS、TLS 或 HTTP 错误都在这里，日志里留下具体原因
        logger.exception("调用 AI 服务失败")
        raise HTTPException(status_code=502, detail="AI 服务暂时不可用") from error
