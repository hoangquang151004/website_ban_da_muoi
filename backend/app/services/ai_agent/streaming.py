"""
streaming.py — SSE event helpers và stream LLM text chunks.
"""

from __future__ import annotations

import json
from typing import Any, AsyncIterator

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


def format_sse_line(frame: dict[str, Any]) -> str:
    return f"data: {json.dumps(frame, ensure_ascii=False)}\n\n"


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
