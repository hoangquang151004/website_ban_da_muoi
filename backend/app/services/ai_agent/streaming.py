"""
streaming.py — SSE event helpers và stream LLM text chunks.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, AsyncIterator
from uuid import UUID

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable


def sse_event(event: str, data: dict[str, Any]) -> dict[str, Any]:
    """Một frame SSE (router sẽ serialize thành data: {...}\\n\\n)."""
    return {"event": event, "data": data}


def status_event(step: str, message: str, **extra: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {"step": step, "message": message}
    payload.update(extra)
    return sse_event("status", payload)


def thinking_event(vote: Any) -> dict[str, Any]:
    if hasattr(vote, "model_dump"):
        data = vote.model_dump()
    elif isinstance(vote, dict):
        data = vote
    else:
        data = {"raw": str(vote)}
    return sse_event("thinking", data)


def token_event(content: str) -> dict[str, Any]:
    return sse_event("token", {"content": content})


def done_event(payload: dict[str, Any]) -> dict[str, Any]:
    return sse_event("done", payload)


def error_event(message: str) -> dict[str, Any]:
    return sse_event("error", {"message": message})


def to_json_safe(value: Any) -> Any:
    """Chuyển Decimal/datetime/Enum... sang kiểu JSON-serializable (SSE / done payload)."""
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {str(k): to_json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_json_safe(v) for v in value]
    if hasattr(value, "model_dump"):
        return to_json_safe(value.model_dump())
    return str(value)


def format_sse_line(frame: dict[str, Any]) -> str:
    safe_frame = to_json_safe(frame)
    return f"data: {json.dumps(safe_frame, ensure_ascii=False)}\n\n"


async def stream_llm_text(chain: Runnable, inputs: dict[str, Any]) -> AsyncIterator[str]:
    """Stream text tokens từ LangChain chain (prompt | llm | StrOutputParser)."""
    async for chunk in chain.astream(inputs):
        if chunk is None:
            continue
        if isinstance(chunk, str):
            if chunk:
                yield chunk
            continue
        content = getattr(chunk, "content", None)
        if content:
            yield str(content)


async def collect_streamed_text(chain: Runnable, inputs: dict[str, Any]) -> str:
    parts: list[str] = []
    async for piece in stream_llm_text(chain, inputs):
        parts.append(piece)
    return "".join(parts)


async def emit_static_text_chunks(
    text: str,
    *,
    chunk_chars: int = 4,
) -> AsyncIterator[str]:
    """Chia câu tĩnh thành chunk nhỏ — hiệu ứng gõ chữ khi không qua LLM."""
    if not text:
        return
    for i in range(0, len(text), chunk_chars):
        yield text[i : i + chunk_chars]


async def yield_text_as_token_events(
    text: str,
    *,
    chunk_chars: int = 4,
) -> AsyncIterator[dict[str, Any]]:
    """Yield các frame SSE token từ chuỗi tĩnh."""
    async for chunk in emit_static_text_chunks(text, chunk_chars=chunk_chars):
        yield token_event(chunk)
