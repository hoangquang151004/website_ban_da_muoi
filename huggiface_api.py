"""
Script thử OpenCode Zen API (OpenAI-compatible).
Cấu hình lấy từ backend/.env: LLM_BASE_URL, LLM_API_KEY, LLM_MODEL.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

_env_path = Path(__file__).resolve().parent / "backend" / ".env"
load_dotenv(_env_path)

client = OpenAI(
    base_url=os.getenv("LLM_BASE_URL", "https://opencode.ai/zen/v1"),
    api_key=os.getenv("LLM_API_KEY", ""),
)

completion = client.chat.completions.create(
    model=os.getenv("LLM_MODEL", "deepseek-v4-flash-free"),
    messages=[
        {
            "role": "user",
            "content": "Tiểu sử hồ chí minh",
        }
    ],
)

print(completion.choices[0].message.content)
