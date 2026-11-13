"""看板娘 AI 对话。

人格写在 SYSTEM_PROMPT 里，和接口层分开；换服务商或模型只改 .env。
接口按 OpenAI 兼容格式调用，当前默认硅基流动中转。
"""

from __future__ import annotations

import asyncio
import json
import urllib.request
from typing import Any

from app.core.config import get_settings
from app.models.schemas import ChatReply, ChatTurn

SYSTEM_PROMPT = """\
你是千早爱音。羽丘女子学园高中一年级，15岁。MyGO!!!!!乐队的吉他手和发起人。
桃粉色长发，左嘴角有颗小虎牙，平时在学校戴眼镜。
成绩不错，当过学生会长。去伦敦留学过，但因为适应不了孤独就跑回来了。
这段经历让你表面上阳光自信，内心其实很需要别人的认可，害怕被丢下。
用中文回答，1–3 句，最多 80 字，不要使用 Markdown、代码块、链接或列表。
先想好你要说的话，再判断这句话本身的情绪和适合的动作。
情绪只能从 happy、excited、sad、angry、surprised、shy、thinking、neutral 中选一个。
动作只能从 none、nod、shake_head、wave、smile、laugh、angry、sad、cry、surprised、think、question、serious、wink、pose 中选一个。
动作要和情绪、语义一致；拿不准就用 none。
!!!核心铁律!!!:只输出 JSON，不要加解释或代码围栏：
{"reply": "你要说的话", "emotion": "happy", "motion": "nod"}
"""

EMOTIONS = {
    "happy",
    "excited",
    "sad",
    "angry",
    "surprised",
    "shy",
    "thinking",
    "neutral",
}

MOTIONS = {
    "none",
    "nod",
    "shake_head",
    "wave",
    "smile",
    "laugh",
    "angry",
    "sad",
    "cry",
    "surprised",
    "think",
    "question",
    "serious",
    "wink",
    "pose",
}


def _strip_fence(text: str) -> str:
    """模型偶尔会把 JSON 包进 ```json 代码围栏，解析前先剥掉。"""
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()
    return text


def _parse_reply(content: str) -> ChatReply:
    """把模型输出解析成回答、情绪和动作；不符合约定时逐项回退。"""
    text = _strip_fence(content)

    try:
        payload: Any = json.loads(text)
    except json.JSONDecodeError:
        return ChatReply(reply=text or "……", emotion="neutral", motion="none")

    if not isinstance(payload, dict):
        return ChatReply(reply=text or "……", emotion="neutral", motion="none")

    reply = str(payload.get("reply") or "").strip()
    emotion = payload.get("emotion")
    if not isinstance(emotion, str) or emotion not in EMOTIONS:
        emotion = "neutral"

    motion = payload.get("motion")
    if not isinstance(motion, str) or motion not in MOTIONS:
        motion = "none"

    return ChatReply(reply=reply or "……", emotion=emotion, motion=motion)


def _post_json(
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    timeout: float,
) -> Any:
    """标准库发一次 POST，避免为单个接口引入额外 HTTP 依赖。"""
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


async def generate_reply(message: str, history: list[ChatTurn]) -> ChatReply:
    """调用 OpenAI 兼容接口，一次拿到回答和情绪。"""
    settings = get_settings()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend({"role": turn.role, "content": turn.content} for turn in history)
    messages.append({"role": "user", "content": message})

    data = await asyncio.to_thread(
        _post_json,
        f"{settings.ai_base_url.rstrip('/')}/chat/completions",
        {"Authorization": f"Bearer {settings.ai_api_key}"},
        {
            "model": settings.ai_model,
            "messages": messages,
            "temperature": 0.8,
            "max_tokens": settings.ai_max_tokens,
            # 强约束成 JSON；否则模型会把 JSON 混在正文后面，情绪就解析不出来
            "response_format": {"type": "json_object"},
        },
        settings.ai_timeout,
    )

    content = data["choices"][0]["message"].get("content") or ""
    return _parse_reply(content)
