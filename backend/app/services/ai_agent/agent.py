"""
agent.py — LangGraph Agent orchestration.

Gồm:
- intent_detector(): phân loại intent từ câu chat
- run_recommendation_agent(): gợi ý sản phẩm
- run_ordering_agent(): đặt hàng qua chat
- run_chat(): endpoint duy nhất tự routing
"""

from __future__ import annotations

import re
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Intent Detection
# ---------------------------------------------------------------------------
class ChatIntent(str, Enum):
    ORDER = "order"           # Mua / thêm vào giỏ
    RECOMMEND = "recommend"   # Tìm / gợi ý
    KNOWLEDGE = "knowledge"   # Tư vấn kiến thức (RAG)


# Từ khóa intent
_ORDER_KEYWORDS = [
    "mua", "thêm vào giỏ", "đặt hàng", "order",
    "thêm giỏ", "cho mình mua", "tôi cần mua", "order giùm",
    "thêm vào cart", "mua giùm", "mua ngay",
]
_RECOMMEND_KEYWORDS = [
    "gợi ý", "recommend", "tìm giúp", "tìm cho",
    "tư vấn", "nên mua gì", "chọn sản phẩm", "sản phẩm nào",
    "loại nào", "cái nào", "gợi ý sản phẩm", "tìm sản phẩm",
    "cần sản phẩm", "đang tìm", "tìm đèn",
]


def detect_intent(message: str) -> ChatIntent:
    """Phân loại intent từ câu chat của user."""
    msg_lower = message.lower()

    # Kiểm tra RECOMMEND trước để tránh false positive với "cho tôi"
    for kw in _RECOMMEND_KEYWORDS:
        if kw in msg_lower:
            return ChatIntent.RECOMMEND

    # Kiểm tra ORDER
    for kw in _ORDER_KEYWORDS:
        if kw in msg_lower:
            return ChatIntent.ORDER

    # Nếu có đề cập giá tiền hoặc công dụng cụ thể → recommend
    if re.search(r"\d+k\b|\d{3,}đ|dưới|tầm|khoảng|giá", msg_lower):
        return ChatIntent.RECOMMEND

    return ChatIntent.KNOWLEDGE


# ---------------------------------------------------------------------------
# Recommendation Agent
# ---------------------------------------------------------------------------
async def run_recommendation_agent(message: str) -> dict:
    """Phân tích câu chat, tìm sản phẩm và trả về answer + products list.

    Returns:
        {"answer": str, "products": list[dict]}
    """
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from app.services.ai_agent.llm import get_llm
    from app.services.ai_agent.tools.product_search import search_products_structured

    # Trích xuất bộ lọc từ câu hỏi
    max_price = _extract_max_price(message)
    min_price = _extract_min_price(message)

    # Tìm sản phẩm
    products = await search_products_structured(
        query=message,
        max_price=max_price,
        min_price=min_price,
    )

    # Tởm hợp kết quả thành câu trả lời tự nhiên
    llm = get_llm()
    if products:
        product_list_text = "\n".join(
            f"- {i+1}. {p['name']} — {int(p['price']):,}đ"
            for i, p in enumerate(products)
        )
        summary_prompt = ChatPromptTemplate.from_messages([
            ("system", "Bạn là trợ lý tư vấn bán hàng đèn đá muối Himalaya. "
                       "Hãy viết câu trả lời thân thiện, ngắn gọn giới thiệu danh sách sản phẩm cho khách."),
            ("human", f"Khách hỏi: {message}\n\nDanh sách sản phẩm tìm được:\n{product_list_text}"),
        ])
        answer = await (summary_prompt | llm | StrOutputParser()).ainvoke({})
    else:
        answer = (
            "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn. "
            "Bạn có thể mô tả thêm nhu cầu hoặc điều chỉnh ngân sách không?"
        )

    return {"answer": answer, "products": products}


def _extract_max_price(text: str) -> Optional[float]:
    """Trích xuất giá tối đa từ câu hỏi."""
    # Patterns: "dưới 500k", "500000đ", "500 nghìn", "tầm 500k"
    patterns = [
        r"dưới\s*(\d+)\s*k\b",
        r"tầm\s*(\d+)\s*k\b",
        r"khoảng\s*(\d+)\s*k\b",
        r"(\d{3,})\s*(?:đồng|vnd|đ)\b",
        r"(\d+)\s*triệu",
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            val = float(match.group(1))
            if "triệu" in pattern:
                return val * 1_000_000
            if "k" in pattern or val < 10000:
                return val * 1000
            return val
    return None


def _extract_min_price(text: str) -> Optional[float]:
    """Trích xuất giá tối thiểu từ câu hỏi."""
    patterns = [
        r"trên\s*(\d+)\s*k\b",
        r"từ\s*(\d+)\s*k\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            val = float(match.group(1))
            return val * 1000
    return None


# ---------------------------------------------------------------------------
# Conversational Ordering Agent
# ---------------------------------------------------------------------------
async def run_ordering_agent(message: str, user_id: int) -> dict:
    """Xử lý yêu cầu đặt hàng qua chat.

    Flow:
    1. Tìm sản phẩm từ câu chat
    2. Trích xuất số lượng
    3. Gọi add_to_cart_tool
    4. Trả lời user

    Returns:
        {"answer": str, "cart_updated": bool, "cart_item": dict | None}
    """
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from app.services.ai_agent.llm import get_llm
    from app.services.ai_agent.tools.product_search import search_products_structured
    from app.services.ai_agent.tools.add_to_cart import add_to_cart_internal

    llm = get_llm()

    # 1. Trích xuất số lượng
    quantity = _extract_quantity(message)

    # 2. Tìm sản phẩm
    products = await search_products_structured(query=message, max_price=None, min_price=None)

    if not products:
        return {
            "answer": "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp. Bạn có thể mô tả thêm không?",
            "cart_updated": False,
            "cart_item": None,
        }

    # Chọn sản phẩm đầu tiên
    selected_product = products[0]
    product_id = selected_product["id"]
    product_name = selected_product["name"]

    # 3. Thêm vào giỏ
    result = await add_to_cart_internal(product_id, quantity, user_id)

    if result["success"]:
        answer_prompt = ChatPromptTemplate.from_messages([
            ("system", "Bạn là trợ lý bán hàng đèn đá muối Himalaya. "
                       "Hãy xác nhận việc thêm sản phẩm vào giỏ hàng một cách thân thiện."),
            ("human",
             f"Khách yêu cầu: '{message}'\n"
             f"Đã thêm {quantity}× '{product_name}' vào giỏ hàng thành công. "
             f"Giá: {int(selected_product['price']):,}đ/cái. "
             "Xác nhận với khách và hỏi có muốn tiếp tục không."),
        ])
        answer = await (answer_prompt | llm | StrOutputParser()).ainvoke({})
        return {
            "answer": answer,
            "cart_updated": True,
            "cart_item": result.get("cart_item"),
        }
    else:
        # Thất bại (hết hàng, v.v.)
        fail_prompt = ChatPromptTemplate.from_messages([
            ("system", "Bạn là trợ lý bán hàng đèn đá muối. Thông báo lỗi thân thiện."),
            ("human", f"Lỗi: {result['message']}. Gợi ý sản phẩm thay thế nếu có thể."),
        ])
        answer = await (fail_prompt | llm | StrOutputParser()).ainvoke({})

        # Gợi ý sản phẩm thay thế
        alternatives = [p for p in products[1:4]]
        alt_text = ""
        if alternatives:
            alt_names = ", ".join(p["name"] for p in alternatives)
            alt_text = f" Bạn có thể xem thêm: {alt_names}."

        return {
            "answer": answer + alt_text,
            "cart_updated": False,
            "cart_item": None,
        }


def _extract_quantity(text: str) -> int:
    """Trích xuất số lượng từ câu hỏi, mặc định là 1."""
    patterns = [
        r"(\d+)\s*(?:cái|cặp|chiếc|bộ|đèn)\b",
        r"mua\s+(\d+)\b",
        r"(\d+)\s*cái",
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return max(1, int(match.group(1)))
    return 1


# ---------------------------------------------------------------------------
# Main Chat Router
# ---------------------------------------------------------------------------
async def run_chat(
    message: str,
    user_id: Optional[int] = None,
    session_id: Optional[str] = None,
) -> dict:
    """Endpoint tổng hợp — tự routing đến đúng chain/agent.

    Returns:
        dict với key "answer" và các key bổ sung tùy intent
    """
    intent = detect_intent(message)

    if intent == ChatIntent.ORDER:
        if user_id is None:
            return {
                "answer": "Vui lòng đăng nhập để đặt hàng qua chat.",
                "cart_updated": False,
                "cart_item": None,
                "intent": intent.value,
            }
        result = await run_ordering_agent(message, user_id)
        result["intent"] = intent.value
        return result

    elif intent == ChatIntent.RECOMMEND:
        result = await run_recommendation_agent(message)
        result["intent"] = intent.value
        return result

    else:  # KNOWLEDGE
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": message})
        result["intent"] = intent.value
        return result
