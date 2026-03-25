"""
intent_chain.py — Semantic Intent Classifier using LLM.

Phân loại ý định của người dùng dựa trên ngữ nghĩa câu chat.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.services.ai_agent.llm import get_llm

logger = logging.getLogger(__name__)


class IntentResult(BaseModel):
    intent: str = Field(description="The detected intent (order, recommend, knowledge, order_query, stats, greeting)")
    confidence: float = Field(description="Confidence score from 0.0 to 1.0")
    reasoning: str = Field(description="Short explanation of why this intent was chosen")


INTENT_SYSTEM_PROMPT = """Bạn là chuyên gia phân loại ý định (Intent Classifier) cho chatbot cửa hàng đèn đá muối Himalaya.
Nhiệm vụ của bạn là phân tích câu chat của người dùng và chọn một trong các ý định sau:

1. `greeting`: Chào hỏi, cảm ơn, chitchat xã giao.
2. `knowledge`: Hỏi về kiến thức, công dụng, cách dùng, phong thủy, bảo quản đèn đá muối. (RAG)
3. `recommend`: Tìm kiếm, gợi ý sản phẩm phù hợp với nhu cầu, ngân sách, màu sắc, kích thước.
4. `order`: Hành động thêm vào giỏ hàng, mua ngay, xóa khỏi giỏ, thanh toán (checkout).
5. `order_query`: Tra cứu trạng thái đơn hàng, xem danh sách đơn hàng đã mua, xem giỏ hàng hiện tại.
6. `stats`: (Chỉ dành cho admin) Yêu cầu báo cáo doanh thu, thống kê sản phẩm bán chạy, KPI kinh doanh.

Hướng dẫn quan trọng:
- Nếu khách hỏi "giá bao nhiêu", "bao nhiêu tiền" kèm tên sản phẩm cụ thể -> `recommend`.
- Nếu khách hỏi "công dụng của đèn" hoặc "đèn có tốt không" -> `knowledge`.
- Nếu khách muốn "mua", "thêm vào giỏ" -> `order`.
- Nếu khách hỏi "đơn hàng của tôi đâu" -> `order_query`.
- Luôn ưu tiên `stats` nếu câu hỏi liên quan đến số liệu kinh doanh tổng hợp và người dùng có quyền admin.

Đầu ra PHẢI là định dạng JSON duy nhất.
"""

INTENT_HUMAN_PROMPT = "Câu chat của người dùng: {message}"

_intent_prompt = ChatPromptTemplate.from_messages([
    ("system", INTENT_SYSTEM_PROMPT),
    ("human", INTENT_HUMAN_PROMPT),
])


async def classify_intent(message: str) -> Optional[IntentResult]:
    """Phân loại ý định bằng LLM Gemini."""
    llm = get_llm()
    parser = JsonOutputParser(pydantic_object=IntentResult)

    chain = _intent_prompt | llm | parser

    try:
        # Sử dụng ainvoke để gọi không đồng bộ
        result = await chain.ainvoke({"message": message})
        return IntentResult(**result)
    except Exception as e:
        logger.error(f"Error classifying intent with LLM: {e}")
        return None
