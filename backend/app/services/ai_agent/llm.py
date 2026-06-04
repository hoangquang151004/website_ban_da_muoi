"""
llm.py — Singleton LLM client.

Đổi provider chỉ cần sửa file .env:
- LLM_PROVIDER=openai        → ChatOpenAI  (cần OPENAI_API_KEY)
- LLM_PROVIDER=gemini        → ChatGoogleGenerativeAI (cần GOOGLE_API_KEY)
- LLM_PROVIDER=ollama        → ChatOllama  (không cần API key, chạy local)
- LLM_PROVIDER=opencode      → ChatOpenAI + LLM_BASE_URL + LLM_API_KEY (OpenCode Zen)
- LLM_PROVIDER=huggingface   → ChatOpenAI HF Router (legacy, cần HF_TOKEN)
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings


def _chat_openai_compatible(
    *,
    base_url: str,
    api_key: str,
    model: str,
):
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=model,
        temperature=0.2,
        api_key=api_key,
        base_url=base_url,
    )


@lru_cache(maxsize=1)
def get_llm():
    """Trả về singleton LLM instance được config từ settings."""
    provider = settings.LLM_PROVIDER.lower()

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL or "gemini-1.5-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.2,
        )

    if provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model=settings.LLM_MODEL or "llama3.2",
            temperature=0.2,
        )

    if provider == "opencode":
        return _chat_openai_compatible(
            base_url=settings.LLM_BASE_URL or "https://opencode.ai/zen/v1",
            api_key=settings.LLM_API_KEY or settings.OPENAI_API_KEY,
            model=settings.LLM_MODEL or "deepseek-v4-flash-free",
        )

    if provider == "huggingface":
        # Luôn dùng HF Router và HF_TOKEN, không bị ảnh hưởng bởi LLM_BASE_URL/LLM_API_KEY
        return _chat_openai_compatible(
            base_url="https://router.huggingface.co/v1",
            api_key=settings.HF_TOKEN,
            model=settings.LLM_MODEL or "openai/gpt-oss-120b:groq",
        )

    # Default: OpenAI
    from langchain_openai import ChatOpenAI

    kwargs: dict = {
        "model": settings.LLM_MODEL or "gpt-4o-mini",
        "temperature": 0.2,
        "api_key": settings.OPENAI_API_KEY,
    }
    if settings.LLM_BASE_URL:
        kwargs["base_url"] = settings.LLM_BASE_URL
    return ChatOpenAI(**kwargs)


def get_llm_display_info() -> dict[str, str]:
    """Thông tin LLM đang dùng (cho log / hiển thị UI chatbot)."""
    provider = (settings.LLM_PROVIDER or "openai").strip().lower()

    if provider == "gemini":
        model = settings.LLM_MODEL or "gemini-1.5-flash"
    elif provider == "ollama":
        model = settings.LLM_MODEL or "llama3.2"
    elif provider == "opencode":
        model = settings.LLM_MODEL or "deepseek-v4-flash-free"
    elif provider == "huggingface":
        model = settings.LLM_MODEL or "openai/gpt-oss-120b:groq"
    else:
        model = settings.LLM_MODEL or "gpt-4o-mini"

    return {
        "llm_provider": provider,
        "llm_model": model,
    }
