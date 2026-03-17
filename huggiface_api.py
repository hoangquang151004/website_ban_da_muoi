# token="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"

import os
from openai import OpenAI

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key="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",
)

completion = client.chat.completions.create(
    model="openai/gpt-oss-120b:groq",
    messages=[
        {
            "role": "user",
            "content": "Tiểu sử hồ chí minh"
        }
    ],
    max_tokens=4096,
)

print(completion.choices[0].message.content)