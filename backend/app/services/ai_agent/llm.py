"""
llm.py — Singleton LLM client.

Đổi provider chỉ cần sửa file .env:
- LLM_PROVIDER=openai    → ChatOpenAI  (cần OPENAI_API_KEY)
- LLM_PROVIDER=gemini    → ChatGoogleGenerativeAI (cần GOOGLE_API_KEY)
- LLM_PROVIDER=ollama    → ChatOllama  (không cần API key, chạy local)
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings


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

    # Default: OpenAI
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=settings.LLM_MODEL or "gpt-4o-mini",
        temperature=0.2,
        api_key=settings.OPENAI_API_KEY,
    )
