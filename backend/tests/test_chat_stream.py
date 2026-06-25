"""Unit tests cho SSE chat streaming."""

from __future__ import annotations

import json
from decimal import Decimal

import pytest
from unittest.mock import AsyncMock, patch

from app.services.ai_agent.streaming import (
    format_sse_line,
    token_event,
    done_event,
    status_event,
    emit_static_text_chunks,
    to_json_safe,
)


class TestSseFormat:
    def test_format_sse_line_json(self):
        frame = token_event("Xin")
        line = format_sse_line(frame)
        assert line.startswith("data: ")
        assert line.endswith("\n\n")
        parsed = json.loads(line[6:].strip())
        assert parsed["event"] == "token"
        assert parsed["data"]["content"] == "Xin"

    def test_to_json_safe_decimal_in_stats_rows(self):
        payload = done_event({
            "answer": "Kết quả",
            "stats_data": {
                "rows": [{"total": Decimal("1500000.50"), "name": "A"}],
            },
        })
        line = format_sse_line(payload)
        parsed = json.loads(line[6:].strip())
        assert parsed["data"]["stats_data"]["rows"][0]["total"] == 1500000.5

    @pytest.mark.asyncio
    async def test_emit_static_text_chunks(self):
        chunks = []
        async for c in emit_static_text_chunks("abcd", chunk_chars=2):
            chunks.append(c)
        assert "".join(chunks) == "abcd"


class TestRunChatStream:
    @pytest.mark.asyncio
    async def test_greeting_stream_emits_done(self):
        from app.services.ai_agent.agent import run_chat_stream

        frames = []
        async for frame in run_chat_stream("xin chào", session_id="test-sess"):
            frames.append(frame)

        events = [f["event"] for f in frames]
        assert "token" in events
        assert events[-1] == "done"
        done_data = frames[-1]["data"]
        assert done_data.get("response_type") == "text"
        assert "Xin chào" in (done_data.get("answer") or "")

    @pytest.mark.asyncio
    async def test_knowledge_stream_mock_rag(self):
        from app.services.ai_agent.agent import run_chat_stream

        async def mock_rag(question: str):
            from app.services.ai_agent.streaming import token_event, done_event
            yield status_event("retrieval", "Đang tra cứu...")
            yield token_event("Đèn ")
            yield token_event("đá muối")
            yield done_event({
                "answer": "Đèn đá muối có lợi ích.",
                "sources": [{"title": "T1", "snippet": "s"}],
                "rag_status": "ok",
            })

        with patch(
            "app.services.ai_agent.chains.rag_chain.stream_rag_with_sources",
            side_effect=mock_rag,
        ):
            with patch(
                "app.services.ai_agent.agent.resolve_intent",
                new_callable=AsyncMock,
                return_value=(__import__(
                    "app.services.ai_agent.agent", fromlist=["ChatIntent"]
                ).ChatIntent.KNOWLEDGE, None),
            ):
                frames = []
                async for frame in run_chat_stream(
                    "công dụng đèn?", session_id="s2"
                ):
                    frames.append(frame)

        assert any(f["event"] == "token" for f in frames)
        done = [f for f in frames if f["event"] == "done"][-1]
        assert done["data"]["answer"] == "Đèn đá muối có lợi ích."
        assert done["data"].get("intent") == "knowledge"
