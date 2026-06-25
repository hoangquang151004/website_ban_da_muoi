"""
chat_memory.py — Bộ nhớ phiên hội thoại (in-memory) theo session_id.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Any, Literal, Optional

from app.core.config import settings

Role = Literal["user", "assistant"]

_MAX_CONTENT_LEN = 500
_SESSION_STORE: dict[str, dict[str, Any]] = {}


@dataclass
class ChatTurn:
    role: Role
    content: str
    intent: Optional[str] = None
    product_names: list[str] = field(default_factory=list)


def _truncate(text: str, max_len: int = _MAX_CONTENT_LEN) -> str:
    text = (text or "").strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def _memory_enabled() -> bool:
    return bool(getattr(settings, "CHAT_MEMORY_ENABLED", True))


def _max_turns() -> int:
    return int(getattr(settings, "CHAT_MEMORY_MAX_TURNS", 8))


def _get_session(session_id: str) -> dict[str, Any]:
    session = _SESSION_STORE.get(session_id)
    if session is None:
        session = {
            "turns": deque(maxlen=_max_turns()),
            "last_products": [],
            "last_intent": None,
        }
        _SESSION_STORE[session_id] = session
    return session


def get_memory_turn_count(session_id: Optional[str]) -> int:
    if not session_id or not _memory_enabled():
        return 0
    session = _SESSION_STORE.get(session_id)
    if not session:
        return 0
    return len(session.get("turns") or [])


def get_last_products(session_id: Optional[str]) -> list[dict]:
    if not session_id or not _memory_enabled():
        return []
    session = _SESSION_STORE.get(session_id)
    if not session:
        return []
    return list(session.get("last_products") or [])


def clear_session(session_id: Optional[str]) -> None:
    if session_id and session_id in _SESSION_STORE:
        del _SESSION_STORE[session_id]


def append_chat_turn(
    session_id: Optional[str],
    user_message: str,
    bot_answer: str,
    intent: Optional[str] = None,
    products: Optional[list[dict]] = None,
) -> None:
    if not session_id or not _memory_enabled():
        return

    session = _get_session(session_id)
    turns: deque = session["turns"]

    product_names = [
        p.get("name", "")
        for p in (products or [])
        if isinstance(p, dict) and p.get("name")
    ]

    turns.append(
        ChatTurn(
            role="user",
            content=_truncate(user_message),
            intent=intent,
        )
    )
    turns.append(
        ChatTurn(
            role="assistant",
            content=_truncate(bot_answer),
            intent=intent,
            product_names=product_names[:6],
        )
    )

    session["last_intent"] = intent
    if products:
        session["last_products"] = products


def get_conversation_context(
    session_id: Optional[str],
    max_turns: Optional[int] = None,
) -> str:
    """Định dạng lịch sử hội thoại cho LLM (không gồm câu hiện tại)."""
    if not session_id or not _memory_enabled():
        return ""

    session = _SESSION_STORE.get(session_id)
    if not session:
        return ""

    turns: deque = session.get("turns") or deque()
    if not turns:
        return ""

    limit = max_turns or _max_turns()
    recent = list(turns)[-limit:]

    lines = ["[Lịch sử hội thoại gần đây]"]
    for turn in recent:
        if turn.role == "user":
            lines.append(f"Khách: {turn.content}")
        else:
            suffix = ""
            if turn.product_names:
                suffix = f" (sản phẩm: {', '.join(turn.product_names[:3])})"
            lines.append(f"Bot: {turn.content}{suffix}")

    return "\n".join(lines)


def build_message_with_context(
    current_message: str,
    conversation_context: str,
    *,
    extra_product_hint: str = "",
) -> str:
    """Ghép lịch sử + câu hiện tại cho chain LLM."""
    parts: list[str] = []
    if conversation_context:
        parts.append(conversation_context)
    if extra_product_hint:
        parts.append(extra_product_hint)
    parts.append(f"[Câu hiện tại]\n{(current_message or '').strip()}")
    return "\n\n".join(parts)


_FOLLOWUP_HINT_KEYWORDS = (
    "cái đó", "cai do", "mẫu đó", "mau do", "sản phẩm đó", "san pham do",
    "cái này", "cai nay", "cái kia", "cai kia", "cái đầu", "cai dau",
    "cái thứ", "cai thu", "thêm cái", "them cai", "mua cái", "mua cai",
    "rẻ nhất", "re nhat", "đắt nhất", "dat nhat", "cái rẻ", "cai re",
)


def enrich_followup_products(
    current_message: str,
    session_id: Optional[str],
) -> str:
    """Bổ sung tên SP vừa gợi ý khi câu follow-up mơ hồ."""
    msg_lower = (current_message or "").lower()
    if not any(kw in msg_lower for kw in _FOLLOWUP_HINT_KEYWORDS):
        return ""

    products = get_last_products(session_id)
    names = ", ".join(p.get("name", "") for p in products[:5] if p.get("name"))
    if not names:
        return ""
    return f"[Sản phẩm vừa gợi ý: {names}]"
