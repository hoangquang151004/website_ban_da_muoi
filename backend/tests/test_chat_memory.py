"""Unit tests for in-process chat session memory."""

import pytest

from app.services.ai_agent import chat_memory


@pytest.fixture(autouse=True)
def _clear_memory_store():
    chat_memory._SESSION_STORE.clear()
    yield
    chat_memory._SESSION_STORE.clear()


def test_append_and_context_format():
    chat_memory.append_chat_turn(
        "sess-1",
        user_message="tư vấn đèn dưới 500k",
        bot_answer="Gợi ý Đèn A, Đèn B",
        intent="recommend",
        products=[{"name": "Đèn A"}, {"name": "Đèn B"}],
    )

    ctx = chat_memory.get_conversation_context("sess-1")
    assert "[Lịch sử hội thoại gần đây]" in ctx
    assert "Khách: tư vấn đèn dưới 500k" in ctx
    assert "Bot: Gợi ý Đèn A" in ctx
    assert "Đèn A" in ctx


def test_deque_maxlen(monkeypatch):
    monkeypatch.setattr(chat_memory.settings, "CHAT_MEMORY_MAX_TURNS", 4)

    for i in range(5):
        chat_memory.append_chat_turn(
            f"sess-max",
            user_message=f"user-{i}",
            bot_answer=f"bot-{i}",
            intent="knowledge",
        )

    ctx = chat_memory.get_conversation_context("sess-max")
    assert "user-0" not in ctx
    assert "user-4" in ctx
    assert chat_memory.get_memory_turn_count("sess-max") == 4


def test_clear_session():
    chat_memory.append_chat_turn(
        "sess-clear",
        user_message="xin chào",
        bot_answer="chào bạn",
        intent="greeting",
    )
    assert chat_memory.get_memory_turn_count("sess-clear") > 0

    chat_memory.clear_session("sess-clear")
    assert chat_memory.get_memory_turn_count("sess-clear") == 0
    assert chat_memory.get_conversation_context("sess-clear") == ""


def test_build_message_with_context():
    out = chat_memory.build_message_with_context(
        "thêm vào giỏ",
        "[Lịch sử]\nKhách: đèn 500k",
        extra_product_hint="[SP: Đèn A]",
    )
    assert "[Câu hiện tại]" in out
    assert "thêm vào giỏ" in out
    assert "[Lịch sử]" in out
    assert "[SP: Đèn A]" in out


def test_memory_disabled(monkeypatch):
    monkeypatch.setattr(chat_memory.settings, "CHAT_MEMORY_ENABLED", False)

    chat_memory.append_chat_turn(
        "sess-off",
        user_message="hi",
        bot_answer="hello",
        intent="greeting",
    )
    assert chat_memory.get_memory_turn_count("sess-off") == 0
    assert "sess-off" not in chat_memory._SESSION_STORE


@pytest.mark.asyncio
async def test_run_chat_multi_turn_memory_in_meta(monkeypatch):
    from unittest.mock import AsyncMock, patch

    from app.services.ai_agent.agent import ChatIntent, run_chat

    async def fake_resolve(_message, user_role=None, conversation_context=None):
        if conversation_context and "500k" in conversation_context:
            return ChatIntent.ORDER, None
        return ChatIntent.GREETING, None

    with patch(
        "app.services.ai_agent.agent.resolve_intent",
        new=AsyncMock(side_effect=fake_resolve),
    ):
        await run_chat("tư vấn đèn dưới 500k", session_id="multi-sess")
        result = await run_chat("thêm cái rẻ nhất", session_id="multi-sess")

    assert result.get("meta", {}).get("memory_turns", 0) >= 2
    ctx = chat_memory.get_conversation_context("multi-sess")
    assert "500k" in ctx or "tư vấn" in ctx


def test_bot_content_truncated(monkeypatch):
    long_answer = "x" * 600
    chat_memory.append_chat_turn(
        "sess-trunc",
        user_message="hi",
        bot_answer=long_answer,
        intent="knowledge",
    )
    session = chat_memory._SESSION_STORE["sess-trunc"]
    bot_turn = [t for t in session["turns"] if t.role == "assistant"][0]
    assert len(bot_turn.content) <= 500
