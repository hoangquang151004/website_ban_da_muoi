"""
agent.py — LangGraph Agent orchestration.

Gồm:
- resolve_intent(): multi-thinking LLM intent (mặc định) hoặc keyword fallback
- detect_intent(): phân loại keyword (INTENT_MODE=keyword)
- run_recommendation_agent(): gợi ý sản phẩm
- run_ordering_agent(): đặt hàng qua chat
- run_chat(): endpoint duy nhất tự routing

Changelog (intent fixes):
  - Thêm ChatIntent.GREETING để tránh gọi RAG cho câu chào hỏi
  - Thêm _KNOWLEDGE_KEYWORDS fast-path cho domain đá muối
  - Sửa "giá" đơn lẻ không còn trigger RECOMMEND
  - Sửa "mua" đơn lẻ không còn trigger ORDER
  - Sửa "order" đơn lẻ route đúng sang ORDER_QUERY
  - Sửa "tìm đèn" → chỉ match đèn đá muối / himalaya
  - Sửa "tuần này" đơn lẻ không còn trigger STATS
  - Thêm override admin ORDER_QUERY → STATS khi cần
  - Thêm regex no-accent cho mobile
  - Thêm xem giỏ hàng vào ORDER_QUERY
"""

from __future__ import annotations

import re
import unicodedata
from datetime import date, timedelta
from dataclasses import dataclass
from enum import Enum
from typing import Any, AsyncIterator, Optional


# ---------------------------------------------------------------------------
# Intent Detection
# ---------------------------------------------------------------------------
class ChatIntent(str, Enum):
    ORDER = "order"             # Mua / thêm / xóa khỏi giỏ
    RECOMMEND = "recommend"     # Tìm / gợi ý sản phẩm
    KNOWLEDGE = "knowledge"     # Tư vấn kiến thức (RAG)
    ORDER_QUERY = "order_query" # Xem / tra cứu đơn hàng, xem giỏ
    STATS = "stats"             # Thống kê kinh doanh (admin)
    GREETING = "greeting"       # Chào hỏi / chitchat ngắn


_ORDER_QUERY_KEYWORDS = [
    "đơn hàng", "don hang", "đơn của tôi", "don cua toi",
    "trạng thái đơn", "trang thai don", "mã đơn", "ma don",
    "đơn số", "don so", "xem đơn", "xem don",
    "kiểm tra đơn", "kiem tra don", "giỏ hàng", "gio hang",
]


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------
def _strip_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt — dùng để match câu gõ nhanh không dấu."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def _normalize_intent_text(text: str) -> str:
    """Lowercase + bỏ dấu; đ/Đ -> d (đèn vs đến)."""
    text = (text or "").lower().replace("đ", "d").replace("Đ", "d")
    normalized = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def _normalize_text_for_match(text: str) -> str:
    normalized = unicodedata.normalize("NFD", (text or "").lower())
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def _contains_how_phrase(message: str) -> bool:
    """Câu hỏi dạng 'như thế nào' — luôn route RAG (KNOWLEDGE)."""
    lower = (message or "").lower()
    if "như thế nào" in lower:
        return True
    return "nhu the nao" in _strip_accents(lower)


def _finalize_chat_response(
    session_id: Optional[str],
    user_message: str,
    intent: ChatIntent,
    result: dict,
) -> dict:
    from app.services.ai_agent.chat_memory import (
        append_chat_turn,
        get_memory_turn_count,
    )

    append_chat_turn(
        session_id,
        user_message=user_message,
        bot_answer=result.get("answer") or "",
        intent=intent.value,
        products=result.get("products") if isinstance(result.get("products"), list) else None,
    )
    result.setdefault("meta", {})
    result["meta"]["memory_turns"] = get_memory_turn_count(session_id)
    return result


def _normalize_user_role(user_role: object) -> Optional[str]:
    if user_role is None:
        return None

    role_value = getattr(user_role, "value", user_role)
    normalized = str(role_value).strip().lower()

    # Fallback cho trường hợp enum stringify thành "UserRole.admin".
    if "." in normalized:
        normalized = normalized.rsplit(".", 1)[-1]

    return normalized or None





def _intent_string_to_enum(intent: str) -> ChatIntent:
    try:
        return ChatIntent(intent.strip().lower())
    except ValueError:
        return ChatIntent.KNOWLEDGE


async def resolve_intent(
    message: str,
    user_role: Optional[str] = None,
    conversation_context: Optional[str] = None,
) -> tuple[ChatIntent, Optional[dict]]:
    """Phân loại intent theo INTENT_MODE. Trả về (intent, debug_meta hoặc None)."""
    from app.core.config import settings
    from app.services.ai_agent.chains.intent_chain import (
        classify_intent,
        classify_intent_multi,
    )

    mode = (settings.INTENT_MODE or "multi").strip().lower()
    debug_meta: Optional[dict] = None

    # ── Fast-path: các câu rõ ràng không cần LLM ────────────────────────
    # Giảm thời gian phân loại cho ~60% câu thường gặp
    if _contains_how_phrase(message):
        return ChatIntent.KNOWLEDGE, debug_meta

    if mode == "single_llm":
        result = await classify_intent(
            message, user_role=user_role, conversation_context=conversation_context
        )
        if result is None:
            return ChatIntent.KNOWLEDGE, debug_meta
        intent = _intent_string_to_enum(result.intent)
        if settings.INTENT_DEBUG:
            debug_meta = {
                "intent_mode": mode,
                "aggregated_confidence": result.confidence,
                "intent_votes": [
                    {
                        "lens": "single",
                        "intent": result.intent,
                        "confidence": result.confidence,
                        "reasoning": result.reasoning,
                    }
                ],
            }
        return intent, debug_meta

    aggregated = await classify_intent_multi(
        message, user_role=user_role, conversation_context=conversation_context
    )
    intent = _intent_string_to_enum(aggregated.intent)

    if settings.INTENT_DEBUG:
        debug_meta = {
            "intent_mode": mode,
            "aggregated_confidence": aggregated.confidence,
            "intent_votes": [
                {
                    "lens": v.lens,
                    "intent": v.intent,
                    "confidence": v.confidence,
                    "reasoning": v.reasoning,
                }
                for v in aggregated.votes
            ],
        }

    return intent, debug_meta


def _looks_like_admin_stats_query(message: str) -> bool:
    lower = (message or "").lower()

    # Rule cứng: câu có "hệ thống" trong ngữ cảnh admin -> route stats.
    if "hệ thống" in lower or "he thong" in lower:
        return True

    explicit_stats_hints = [
        "doanh thu", "lợi nhuận", "thống kê", "báo cáo", "kpi",
        "top sản phẩm", "sản phẩm bán chạy",
        # FIX #6: "trạng thái đơn" chuyển sang đây thay vì ORDER_QUERY_KEYWORDS
        # để admin hỏi phân bố đơn → STATS thay vì ORDER_QUERY
        "trạng thái đơn",
        "khách hàng mới", "danh mục", "tồn kho", "tăng trưởng",
    ]
    if any(keyword in lower for keyword in explicit_stats_hints):
        return True

    business_entities = [
        "đơn", "đơn hàng", "khách hàng", "sản phẩm", "danh mục", "tồn kho",
    ]
    analytics_patterns = [
        "bao nhiêu", "tổng", "theo", "so sánh", "tỷ lệ",
        "xu hướng", "trung bình", "hôm nay", "tuần", "tháng",
        "30 ngày", "gần nhất", "top",
    ]
    return any(entity in lower for entity in business_entities) and any(
        pattern in lower for pattern in analytics_patterns
    )


# ---------------------------------------------------------------------------
# Recommendation Agent
# ---------------------------------------------------------------------------
def _format_vnd_price(amount: float) -> str:
    return f"{int(round(amount)):,}".replace(",", ".") + "đ"


def _recommendation_filter_summary(search_filters: dict) -> Optional[str]:
    """Mô tả ngắn bộ lọc giá + công dụng (cho intro gợi ý)."""
    parts: list[str] = []

    # Công dụng
    use_labels = search_filters.get("use_labels")
    if use_labels:
        uses_str = ", ".join(f"**{u}**" for u in use_labels)
        parts.append(f"công dụng {uses_str}")

    # Giá
    min_p = search_filters.get("min_price")
    max_p = search_filters.get("max_price")
    if min_p is not None and max_p is not None:
        parts.append(
            f"khoảng {_format_vnd_price(float(min_p))} – "
            f"{_format_vnd_price(float(max_p))}"
        )
    elif min_p is not None:
        parts.append(f"từ {_format_vnd_price(float(min_p))} trở lên")
    elif max_p is not None:
        parts.append(f"dưới {_format_vnd_price(float(max_p))}")

    return ", ".join(parts) if parts else None


def build_recommendation_answer(
    products: list[dict],
    search_filters: Optional[dict] = None,
) -> str:
    """Câu trả lời gợi ý dạng danh sách — dễ đọc, khớp thẻ sản phẩm bên dưới."""
    filters = search_filters or {}
    n = len(products)
    if n == 0:
        return (
            "Mình chưa tìm thấy sản phẩm khớp bộ lọc trong cửa hàng. "
            "Bạn thử nới ngân sách, đổi công dụng (ví dụ ngủ hoặc thư giãn), "
            "hoặc hỏi \"gợi ý đèn bán chạy\" nhé."
        )

    filter_line = _recommendation_filter_summary(filters)
    if n == 1:
        intro = "Mình tìm thấy **1** sản phẩm phù hợp"
    else:
        intro = f"Mình tìm thấy **{n}** sản phẩm phù hợp"
    if filter_line:
        intro += f" ({filter_line})"
    intro += ":\n\n"

    blocks: list[str] = [intro]
    for idx, product in enumerate(products, start=1):
        name = product.get("name") or "Sản phẩm"
        price = _format_vnd_price(float(product.get("price") or 0))
        stock = int(product.get("stock") or 0)
        blocks.append(f"{idx}. **{name}**")
        blocks.append(f"   - Giá: {price}")
        blocks.append(f"   - Còn hàng: {stock}")
        blocks.append("")

    name_hint = filters.get("name_hint")
    if name_hint and n == 1:
        closing = (
            f"Bạn xem thẻ sản phẩm bên dưới để xem ảnh và đặt hàng. "
            f"Cần tư vấn thêm về **{name_hint}** không?"
        )
    elif n == 1:
        closing = (
            "Bạn xem thẻ sản phẩm bên dưới để xem ảnh và đặt hàng. "
            "Cần tư vấn thêm không?"
        )
    else:
        closing = (
            "Bạn xem các thẻ sản phẩm bên dưới (ảnh, giá, nút thêm giỏ). "
            "Bạn quan tâm sản phẩm số mấy ạ?"
        )
    blocks.append(closing)
    return "\n".join(blocks).strip()


async def run_recommendation_agent(
    message: str,
    conversation_context: Optional[str] = None,
) -> dict:
    """Phân tích câu chat, tìm sản phẩm và trả về answer + products list.

    Returns:
        {"answer": str, "products": list[dict], "meta": dict}
    """
    from app.services.ai_agent.tools.product_search import search_products_structured_with_meta

    products, search_filters = await search_products_structured_with_meta(
        message, conversation_context=conversation_context
    )

    meta: dict = {"search_filters": search_filters}
    # Truyền use_labels vào search_filters để build_recommendation_answer hiển thị
    if "use_labels" not in search_filters and search_filters.get("use_ids"):
        from app.services.ai_agent.tools.product_db_search import get_product_catalog_cached
        catalog = await get_product_catalog_cached()
        id_to_name = {u["id"]: u["name"] for u in catalog.get("uses", [])}
        search_filters["use_labels"] = [
            id_to_name[uid] for uid in search_filters["use_ids"] if uid in id_to_name
        ]
    answer = build_recommendation_answer(products, search_filters)

    return {"answer": answer, "products": products, "meta": meta}


def _has_strong_order_query_signal(message: str) -> bool:
    """Câu tra cứu đơn / giỏ rõ ràng — không ép RECOMMEND."""
    lower = (message or "").lower()
    for kw in _ORDER_QUERY_KEYWORDS:
        if kw in lower:
            return True
    norm = _normalize_intent_text(message)
    order_patterns = [
        r"\b(don hang|lich su don|xem don|tra don|theo doi don)\b",
        r"\border\s*(hang|#|\d)",
        r"\bdon\s*#\s*\d+",
        r"\bkiem tra don\b",
    ]
    return any(re.search(p, norm) for p in order_patterns)


def _is_product_consultation_message(message: str) -> bool:
    """Tư vấn/gợi ý/tìm sản phẩm — route RECOMMEND (không nhầm order_query)."""
    if _has_strong_order_query_signal(message):
        return False

    lower = (message or "").lower()

    # Nếu câu hỏi chứa từ khóa gợi ý/recommend mạnh -> luôn là RECOMMEND
    if any(kw in lower for kw in ["gợi ý", "goi y", "recommend"]):
        return True

    norm = _normalize_intent_text(message)

    price_patterns = [
        r"duoi\s*\d+\s*k\b",
        r"tam\s*\d+\s*k\b",
        r"khoang\s*\d+\s*k\b",
        r"\d+\s*trieu",
        r"\d{3,}\s*(?:dong|vnd|d)\b",
        r"tren\s*\d+\s*k\b",
        r"tu\s*\d+\s*k\b",
    ]
    if any(re.search(p, norm) for p in price_patterns):
        return True

    shopping_keywords = [
        "gợi ý", "goi y", "tư vấn sản phẩm", "tu van san pham",
        "tìm đèn", "tim den", "tìm sản phẩm", "tim san pham",
        "mua đèn", "mua den", "sản phẩm phù hợp", "san pham phu hop",
        "ngân sách", "ngan sach", "recommend", "catalog", "danh mục", "danh muc",
        "dưới", "tầm", "khoảng", "giá rẻ", "gia re",
    ]
    product_hints = ["đèn", "den", "sản phẩm", "san pham", "đá muối", "da muoi"]
    if any(kw in lower for kw in shopping_keywords) and any(
        kw in lower for kw in product_hints
    ):
        return True

    has_consult = bool(
        re.search(r"\b(tu\s+van|goi\s+y)\b", norm)
        or "tu van san pham" in norm
        or "goi y" in lower
        or "gợi ý" in lower
    )
    has_product = bool(
        re.search(r"\b(san\s+pham|den\s+da|den\s+muoi|tim\s+den|tim\s+san\s+pham)\b", norm)
        or any(kw in lower for kw in product_hints)
    )
    return has_consult and has_product


def _looks_like_product_shopping_query(message: str) -> bool:
    """Heuristic: câu hỏi tìm/gợi ý mua sản phẩm — ép RECOMMEND thay vì RAG."""
    return _is_product_consultation_message(message)


def _has_explicit_price_filter(message: str) -> bool:
    """Chỉ True khi có pattern giá MUA cụ thể — tránh ép knowledge sang recommend."""
    norm = _normalize_intent_text(message)
    price_patterns = [
        r"duoi\s*\d+\s*k\b",
        r"tam\s*\d+\s*k\b",
        r"khoang\s*\d+\s*k\b",
        r"\d+\s*trieu",
        r"\d{3,}\s*(?:dong|vnd|d)\b",
        r"tren\s*\d+\s*k\b",
        r"tu\s*\d+\s*k\b",
    ]
    return any(re.search(p, norm) for p in price_patterns)


async def _has_use_based_recommendation_signal(message: str) -> bool:
    """Phát hiện câu gợi ý sản phẩm theo công dụng — override knowledge → recommend.

    True khi câu có keyword công dụng KÈM keyword tìm/gợi ý/sản phẩm.
    Tránh match câu kiến thức thuần túy như "đèn đá muối có tác dụng gì?".
    """
    from app.services.ai_agent.tools.product_db_search import get_dynamic_use_keywords
    
    lower = (message or "").lower()
    dynamic_use_keywords = await get_dynamic_use_keywords()
    has_use = any(kw in lower for kw in dynamic_use_keywords)
    if not has_use:
        return False

    # Cần kèm tín hiệu tìm/gợi ý/sản phẩm
    recommend_signals = [
        "gợi ý", "goi y", "tư vấn", "tu van", "tìm", "tim",
        "cho xem", "xem", "recommend", "mua", "đèn nào", "den nao",
        "sản phẩm nào", "san pham nao", "có không", "co khong",
    ]
    product_hints = ["đèn", "den", "sản phẩm", "san pham", "đá muối", "da muoi"]

    has_recommend = any(kw in lower for kw in recommend_signals)
    has_product = any(kw in lower for kw in product_hints)

    return has_recommend or has_product


def _extract_max_price(text: str) -> Optional[float]:
    """Trích xuất giá tối đa từ câu hỏi."""
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


def _is_checkout_request(message: str) -> bool:
    msg = (message or "").lower()
    return any(kw in msg for kw in ["checkout", "thanh toán", "mua ngay", "chốt đơn", "đặt đơn"])


def _slugify_fallback(text: str, fallback: str = "") -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return normalized or fallback


def _safe_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: object, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _normalize_checkout_cart_items(result: dict) -> list[dict]:
    """Chuẩn hóa cart item trả về cho checkout panel, tránh ném exception khi thiếu dữ liệu."""
    raw_items: list[dict] = []

    cart_items = result.get("cart_items")
    if isinstance(cart_items, list):
        raw_items.extend(item for item in cart_items if isinstance(item, dict))

    cart_item = result.get("cart_item")
    if isinstance(cart_item, dict):
        raw_items.append(cart_item)

    normalized_items: list[dict] = []
    for item in raw_items:
        product_id = _safe_int(item.get("product_id"), 0)
        product_name = str(item.get("product_name") or item.get("name") or "").strip()
        if product_id <= 0 or not product_name:
            continue

        quantity = _safe_int(item.get("quantity"), 0)
        if quantity <= 0:
            continue

        unit_price = _safe_float(item.get("unit_price", item.get("price")), 0.0)
        if unit_price < 0:
            continue

        subtotal = _safe_float(item.get("subtotal"), unit_price * quantity)
        if subtotal < 0:
            subtotal = unit_price * quantity

        product_slug = str(item.get("product_slug") or item.get("slug") or "").strip()
        if not product_slug:
            product_slug = _slugify_fallback(product_name, fallback=f"product-{product_id}")

        image_url = str(item.get("image_url") or "")

        normalized_items.append(
            {
                "product_id": product_id,
                "product_name": product_name,
                "product_slug": product_slug,
                "image_url": image_url,
                "unit_price": unit_price,
                "quantity": quantity,
                "subtotal": subtotal,
            }
        )

    return normalized_items


# ---------------------------------------------------------------------------
# Conversational Ordering Agent
# ---------------------------------------------------------------------------
async def _extract_order_entities_via_llm(message: str, conversation_context: str) -> dict:
    from app.services.ai_agent.llm import get_llm
    from langchain_core.prompts import ChatPromptTemplate
    from app.services.ai_agent.chains.intent_chain import _extract_json_safe
    import logging

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Trích xuất thông tin đặt hàng từ câu người dùng. Trả về JSON chứa: {{\"action\": \"add\"|\"remove\", \"product_name\": \"tên sản phẩm cụ thể\" hoặc null, \"quantity\": số nguyên}}. Nếu khách không nói rõ sản phẩm nào, hãy để product_name là null. Ví dụ: \"cho 2 cái đèn đá muối\" -> {{\"action\": \"add\", \"product_name\": \"đèn đá muối\", \"quantity\": 2}}."),
        ("human", "{conversation_context}\nCâu chat: {message}")
    ])
    llm = get_llm()
    chain = prompt | llm
    try:
        res = await chain.ainvoke({"message": message, "conversation_context": conversation_context})
        raw = res.content if hasattr(res, "content") else str(res)
        parsed = _extract_json_safe(raw)
        if parsed:
            return {
                "action": parsed.get("action", "add"),
                "product_name": parsed.get("product_name"),
                "quantity": max(1, int(parsed.get("quantity") or 1))
            }
    except Exception as e:
        logging.getLogger(__name__).warning(f"Error extracting order entities: {e}")
    return {"action": "add", "product_name": None, "quantity": 1}

async def run_ordering_agent(
    message: str,
    user_id: int,
    conversation_context: Optional[str] = None,
) -> dict:
    """Xử lý yêu cầu đặt hàng qua chat bằng LLM Extraction."""
    from app.services.ai_agent.chat_memory import build_message_with_context
    from app.services.ai_agent.tools.product_search import search_products_structured
    from app.services.ai_agent.tools.add_to_cart import add_to_cart_internal

    entities = await _extract_order_entities_via_llm(message, conversation_context or "")
    quantity = entities.get("quantity", 1)
    is_remove_request = (entities.get("action") == "remove")
    requested_product_name = entities.get("product_name")

    if not requested_product_name:
        # Prevent auto-fallback without a product name
        return {
            "answer": "Bạn muốn thêm/xoá sản phẩm nào vào giỏ hàng ạ? Vui lòng nói rõ tên sản phẩm giúp tôi nhé.",
            "cart_updated": False,
            "cart_item": None,
        }

    search_query = build_message_with_context(message, conversation_context or "")
    selected_product: dict | None = await _find_best_product_by_name(requested_product_name)

    products = await search_products_structured(
        query=search_query, max_price=None, min_price=None
    )

    if selected_product is None and products:
        ranked = sorted(
            products,
            key=lambda p: _score_product_name_match(p.get("name", ""), requested_product_name),
            reverse=True,
        )
        if ranked:
            top_score = _score_product_name_match(ranked[0].get("name", ""), requested_product_name)
            if top_score >= 0.55:
                selected_product = ranked[0]

    if selected_product is None:
        return {
            "answer": f"Xin lỗi, tôi không tìm thấy sản phẩm nào khớp với '{requested_product_name}'. Bạn có thể kiểm tra lại tên sản phẩm hoặc yêu cầu tôi gợi ý được không?",
            "cart_updated": False,
            "cart_item": None,
        }

    product_id = selected_product["id"]
    product_name = selected_product["name"]

    if is_remove_request:
        return {
            "answer": f"Đã xóa '{product_name}' khỏi giỏ hàng.",
            "cart_updated": False,
            "cart_removed": True,
            "cart_item": {
                "product_id": product_id,
                "product_name": product_name,
                "product_slug": selected_product.get("slug", ""),
                "image_url": selected_product.get("image_url", ""),
                "quantity": 0,
                "price": float(selected_product.get("price", 0) or 0),
            },
        }

    result = await add_to_cart_internal(product_id, quantity, user_id)

    if result["success"]:
        return {
            "answer": f"Đã thêm {quantity} × '{product_name}' vào giỏ hàng.",
            "cart_updated": True,
            "cart_item": result.get("cart_item"),
        }
    else:
        alternatives = [p for p in products[1:4]]
        alt_text = ""
        if alternatives:
            alt_names = ", ".join(p["name"] for p in alternatives)
            alt_text = f" Bạn có thể xem thêm: {alt_names}."

        return {
            "answer": f"{result['message']}{alt_text}",
            "cart_updated": False,
            "cart_item": None,
        }


def _score_product_name_match(product_name: str, requested_name: str) -> float:
    product_norm = _normalize_text_for_match(product_name)
    request_norm = _normalize_text_for_match(requested_name)

    if not product_norm or not request_norm:
        return 0.0

    if product_norm == request_norm:
        return 1.0

    if request_norm in product_norm:
        return 0.9 + min(len(request_norm) / max(len(product_norm), 1), 0.1)

    request_tokens = set(request_norm.split())
    product_tokens = set(product_norm.split())
    if not request_tokens or not product_tokens:
        return 0.0

    overlap = len(request_tokens & product_tokens)
    return overlap / len(request_tokens)


async def _find_best_product_by_name(requested_name: str) -> Optional[dict]:
    from sqlalchemy import and_, or_, select
    from app.db.session import AsyncSessionLocal
    from app.models.product import Product

    name_norm = _normalize_text_for_match(requested_name)
    if not name_norm:
        return None

    # Dùng DB-level LIKE search thay vì load 300 SP vào RAM
    # Thử exact/contains match trước, nếu không có thì thử token-level
    like_terms = [f"%{tok}%" for tok in name_norm.split() if len(tok) >= 3]

    async with AsyncSessionLocal() as session:
        conditions = [Product.is_active == True, Product.stock > 0]  # noqa: E712

        if like_terms:
            like_conds = [Product.name.ilike(term) for term in like_terms]
            conditions.append(or_(*like_conds))

        result = await session.execute(
            select(Product)
            .where(and_(*conditions))
            .limit(20)
        )
        products = result.scalars().all()

    if not products:
        return None

    # Score trên tập nhỏ (≤20) thay vì 300
    best_product = None
    best_score = 0.0
    for product in products:
        score = _score_product_name_match(product.name, requested_name)
        if score > best_score:
            best_score = score
            best_product = product

    if best_product is None or best_score < 0.55:
        return None

    return {
        "id": best_product.id,
        "name": best_product.name,
        "slug": best_product.slug,
        "price": float(best_product.price),
        "image_url": best_product.image_url,
        "stock": best_product.stock,
    }



def _extract_order_id(text: str) -> int | None:
    patterns = [
        r"đơn\s*#(\d+)",
        r"đơn\s*số\s*(\d+)",
        r"mã\s*đơn\s*(\d+)",
        r"order\s*#?(\d+)",
        r"chi\s*tiết\s*đơn\s*(\d+)",
    ]
    lower = text.lower()
    for pattern in patterns:
        match = re.search(pattern, lower)
        if match:
            return int(match.group(1))
    return None


def _serialize_order_summary(order: object) -> dict:
    items = getattr(order, "items", None) or []
    first_item = items[0] if items else None
    first_product = getattr(first_item, "product", None) if first_item else None

    return {
        "id": getattr(order, "id", None),
        "status": str(getattr(getattr(order, "status", None), "value", getattr(order, "status", ""))),
        "total_amount": float(getattr(order, "total_amount", 0) or 0),
        "created_at": getattr(order, "created_at", None).isoformat() if getattr(order, "created_at", None) else None,
        "items_count": len(items),
        "first_item_name": getattr(first_product, "name", None),
        "first_item_image_url": getattr(first_product, "image_url", None),
    }


def _serialize_order_detail(order: object) -> dict:
    items = getattr(order, "items", None) or []
    serialized_items = []
    for item in items:
        product = getattr(item, "product", None)
        quantity = int(getattr(item, "quantity", 0) or 0)
        unit_price = float(getattr(item, "unit_price", 0) or 0)
        subtotal = float(getattr(item, "subtotal", 0) or (unit_price * quantity))
        serialized_items.append(
            {
                "product_name": getattr(product, "name", None),
                "image_url": getattr(product, "image_url", None),
                "quantity": quantity,
                "unit_price": unit_price,
                "subtotal": subtotal,
                "product_slug": getattr(product, "slug", None),
            }
        )

    return {
        "id": getattr(order, "id", None),
        "receiver_name": getattr(order, "receiver_name", None),
        "receiver_phone": getattr(order, "receiver_phone", None),
        "receiver_address": getattr(order, "receiver_address", None),
        "note": getattr(order, "note", None),
        "payment_method": str(getattr(getattr(order, "payment_method", None), "value", getattr(order, "payment_method", ""))),
        "status": str(getattr(getattr(order, "status", None), "value", getattr(order, "status", ""))),
        "total_amount": float(getattr(order, "total_amount", 0) or 0),
        "created_at": getattr(order, "created_at", None).isoformat() if getattr(order, "created_at", None) else None,
        "items": serialized_items,
    }


async def run_order_query_agent(message: str, user_id: int) -> dict:
    """Tra cứu đơn hàng theo nội dung chat của người dùng đã đăng nhập."""
    from app.db.session import AsyncSessionLocal
    from app.services.crud import order as order_crud

    order_id = _extract_order_id(message)

    async with AsyncSessionLocal() as db:
        if order_id is not None:
            order = await order_crud.get_order_by_id(db=db, order_id=order_id)

            if order is None:
                return {
                    "answer": f"Mình không tìm thấy đơn hàng #{order_id}. Bạn kiểm tra lại mã đơn nhé.",
                    "orders": None,
                    "order_detail": None,
                }

            if order.user_id != user_id:
                return {
                    "answer": "Bạn không có quyền xem đơn hàng này.",
                    "orders": None,
                    "order_detail": None,
                }

            return {
                "answer": f"Đây là chi tiết đơn hàng #{order.id}.",
                "orders": None,
                "order_detail": _serialize_order_detail(order),
            }

        result = await order_crud.list_user_orders(db=db, user_id=user_id, page=1, limit=5)
        orders = [_serialize_order_summary(order) for order in result.get("items", [])]

    return {
        "answer": "Đây là các đơn hàng gần nhất của bạn.",
        "orders": orders,
        "order_detail": None,
    }


def _detect_stats_mode(message: str) -> str:
    lower = (message or "").lower()

    # Rule cứng theo yêu cầu: có "hệ thống" thì ưu tiên SQL.
    if "hệ thống" in lower or "he thong" in lower:
        return "text_to_sql"

    # Câu hỏi mang tính phân tích / truy vấn linh hoạt nên ưu tiên Text-to-SQL.
    text_to_sql_hints = [
        "theo danh mục", "khung giờ", "theo giờ", "so sánh", "tăng trưởng",
        "xu hướng", "bao nhiêu", "chi tiết", "lọc", "tuần trước",
        "tháng trước", "khách hàng mới", "tỷ lệ chuyển đổi",
        "theo ngày", "theo tháng",
    ]
    if any(keyword in lower for keyword in text_to_sql_hints):
        return "text_to_sql"

    rest_keywords = [
        "doanh thu", "kpi", "top sản phẩm", "sản phẩm bán chạy",
        "trạng thái đơn", "tồn kho thấp", "tổng quan",
    ]
    if any(keyword in lower for keyword in rest_keywords):
        return "rest"
    return "text_to_sql"


def _resolve_stats_date_range(message: str) -> tuple[date, date]:
    today = date.today()
    lower = (message or "").lower()

    if "hôm nay" in lower or "hom nay" in lower:
        return today, today

    if "tuần này" in lower or "tuan nay" in lower:
        week_start = today - timedelta(days=today.weekday())
        return week_start, today

    if "tháng này" in lower or "thang nay" in lower:
        month_start = today.replace(day=1)
        return month_start, today

    if "30 ngày" in lower or "30 ngay" in lower:
        return today - timedelta(days=29), today

    return today - timedelta(days=29), today


def _build_stats_response(
    *,
    answer: str,
    widget_type: str,
    source: str,
    items: Optional[list] = None,
    rows: Optional[list[dict]] = None,
    summary: Optional[dict] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sql_query: Optional[str] = None,
) -> dict:
    stats_data = {
        "widget_type": widget_type,
        "items": items if items is not None else [],
        "rows": rows if rows is not None else [],
        "summary": summary,
        "date_from": date_from.isoformat() if date_from else None,
        "date_to": date_to.isoformat() if date_to else None,
        "sql_query": sql_query,
    }
    return {
        "answer": answer,
        "stats_data": stats_data,
        "meta": {"source": source},
    }


def _kpi_to_items(kpi: dict) -> list[dict]:
    metric_labels = {
        "total_revenue": "Tổng doanh thu",
        "gross_profit": "Lợi nhuận gộp",
        "total_cost": "Tổng giá vốn",
        "avg_order_value": "Giá trị đơn trung bình",
        "completed_orders": "Đơn hoàn tất",
        "new_customers": "Khách hàng mới",
        "growth_pct": "Tăng trưởng (%)",
    }
    items: list[dict] = []
    for key, value in kpi.items():
        items.append(
            {
                "key": key,
                "label": metric_labels.get(key, key),
                "value": value,
            }
        )
    return items


async def run_stats_rest_agent(message: str) -> dict:
    from app.db.session import AsyncSessionLocal
    from app.services.crud import admin_statistics as stats_crud

    lower = (message or "").lower()
    date_from, date_to = _resolve_stats_date_range(message)

    async with AsyncSessionLocal() as db:
        if "top sản phẩm" in lower or "sản phẩm bán chạy" in lower or "bán chạy" in lower:
            items = await stats_crud.get_top_products(db, limit=10, date_from=date_from, date_to=date_to)
            return _build_stats_response(
                answer="Đây là top sản phẩm bán chạy trong giai đoạn bạn yêu cầu.",
                widget_type="top_products",
                source="rest",
                items=items,
                date_from=date_from,
                date_to=date_to,
            )

        if "trạng thái đơn" in lower or "tỷ lệ đơn" in lower or "ty le don" in lower:
            items = await stats_crud.get_order_status_distribution(db, date_from, date_to)
            return _build_stats_response(
                answer="Đây là phân bố trạng thái đơn hàng trong giai đoạn bạn yêu cầu.",
                widget_type="order_status",
                source="rest",
                items=items,
                date_from=date_from,
                date_to=date_to,
            )

        if "doanh thu" in lower or "revenue" in lower:
            items = await stats_crud.get_revenue_chart(
                db,
                period="daily",
                date_from=date_from,
                date_to=date_to,
            )
            return _build_stats_response(
                answer="Đây là biểu đồ doanh thu trong giai đoạn bạn yêu cầu.",
                widget_type="revenue_chart",
                source="rest",
                items=items,
                date_from=date_from,
                date_to=date_to,
            )

        kpi = await stats_crud.get_kpi_stats(db, date_from, date_to)
        summary: dict | None = None
        if "tồn kho thấp" in lower or "ton kho thap" in lower:
            overview = await stats_crud.get_overview(db)
            summary = {"low_stock_count": overview.get("low_stock_count", 0)}

        return _build_stats_response(
            answer="Đây là các chỉ số KPI tổng quan trong giai đoạn bạn yêu cầu.",
            widget_type="kpi",
            source="rest",
            items=_kpi_to_items(kpi),
            summary=summary,
            date_from=date_from,
            date_to=date_to,
        )


async def run_stats_agent(message: str) -> dict:
    mode = _detect_stats_mode(message)
    if mode == "rest":
        return await run_stats_rest_agent(message)

    from app.services.ai_agent.chains.admin_report import run_admin_report

    result = await run_admin_report(message)
    summary = {"error": result.get("error")} if result.get("error") else None
    return _build_stats_response(
        answer=result.get("answer") or "Đây là kết quả truy vấn báo cáo linh hoạt.",
        widget_type="table",
        source="text_to_sql",
        rows=result.get("raw_data") or [],
        sql_query=result.get("sql_query"),
        summary=summary,
    )


# ---------------------------------------------------------------------------
# Chat route context (shared by run_chat / run_chat_stream)
# ---------------------------------------------------------------------------
@dataclass
class ChatRouteContext:
    message: str
    effective_message: str
    conversation_context: str
    normalized_role: Optional[str]
    intent: ChatIntent
    intent_debug_meta: Optional[dict]
    user_id: Optional[int]
    session_id: Optional[str]


async def _resolve_chat_route(
    message: str,
    user_id: Optional[int] = None,
    user_role: Optional[str] = None,
    session_id: Optional[str] = None,
) -> ChatRouteContext:
    from app.services.ai_agent.chat_memory import (
        build_message_with_context,
        enrich_followup_products,
        get_conversation_context,
    )

    conversation_context = get_conversation_context(session_id) or ""
    product_hint = enrich_followup_products(message, session_id)
    effective_message = build_message_with_context(
        message,
        conversation_context,
        extra_product_hint=product_hint,
    )
    normalized_role = _normalize_user_role(user_role)
    
    # Chỉ sử dụng tối đa 2 lượt hội thoại gần đây để phân loại intent nhằm tránh nhiễu thông tin
    intent_context = get_conversation_context(session_id, max_turns=2) or ""
    
    intent, intent_debug_meta = await resolve_intent(
        message,
        user_role=normalized_role,
        conversation_context=intent_context or None,
    )

    if (
        intent == ChatIntent.KNOWLEDGE
        and normalized_role == "admin"
        and _looks_like_admin_stats_query(effective_message)
    ):
        intent = ChatIntent.STATS

    if (
        intent == ChatIntent.ORDER_QUERY
        and normalized_role == "admin"
        and _looks_like_admin_stats_query(effective_message)
    ):
        intent = ChatIntent.STATS

    # Chỉ override knowledge → recommend khi có price filter rõ ràng
    # Tránh ép mọi câu chứa "đèn" + keyword shopping sang recommend
    if intent == ChatIntent.KNOWLEDGE and (
        _has_explicit_price_filter(message)
        or _has_explicit_price_filter(effective_message)
    ):
        intent = ChatIntent.RECOMMEND

    # Override knowledge → recommend khi câu có pattern gợi ý theo công dụng
    # Ví dụ: "gợi ý đèn giúp ngủ ngon", "tìm đèn thư giãn"
    if intent == ChatIntent.KNOWLEDGE and await _has_use_based_recommendation_signal(message):
        intent = ChatIntent.RECOMMEND

    if _contains_how_phrase(message) or _contains_how_phrase(effective_message):
        intent = ChatIntent.KNOWLEDGE

    return ChatRouteContext(
        message=message,
        effective_message=effective_message,
        conversation_context=conversation_context,
        normalized_role=normalized_role,
        intent=intent,
        intent_debug_meta=intent_debug_meta,
        user_id=user_id,
        session_id=session_id,
    )


def _attach_route_meta(result: dict, ctx: ChatRouteContext) -> dict:
    from app.services.ai_agent.llm import get_llm_display_info

    existing = result.get("meta") or {}
    result["meta"] = {**existing, **get_llm_display_info()}
    if ctx.intent_debug_meta:
        result["meta"] = {**result["meta"], **ctx.intent_debug_meta}
    return result


async def stream_recommendation_agent(
    message: str,
    conversation_context: Optional[str] = None,
) -> AsyncIterator[dict[str, Any]]:
    """Stream SSE frames cho gợi ý sản phẩm."""
    from app.services.ai_agent.streaming import (
        done_event,
        status_event,
        yield_text_as_token_events,
    )
    from app.services.ai_agent.tools.product_search import search_products_structured_with_meta

    yield status_event("search_products", "Đang tìm sản phẩm phù hợp...")

    products, search_filters = await search_products_structured_with_meta(
        message, conversation_context=conversation_context
    )
    meta: dict = {"search_filters": search_filters}
    # Bổ sung use_labels nếu có use_ids nhưng chưa có labels
    if "use_labels" not in search_filters and search_filters.get("use_ids"):
        from app.services.ai_agent.tools.product_db_search import get_product_catalog_cached
        catalog = await get_product_catalog_cached()
        id_to_name = {u["id"]: u["name"] for u in catalog.get("uses", [])}
        search_filters["use_labels"] = [
            id_to_name[uid] for uid in search_filters["use_ids"] if uid in id_to_name
        ]
    answer = build_recommendation_answer(products, search_filters)

    if products:
        yield status_event("generation", "Đang soạn gợi ý...")
    async for frame in yield_text_as_token_events(answer):
        yield frame

    yield done_event({"answer": answer, "products": products, "meta": meta})


async def _stream_result_payload(
    ctx: ChatRouteContext,
    result: dict,
    *,
    response_type: Optional[str] = None,
    extra_finalize: Optional[dict] = None,
) -> AsyncIterator[dict[str, Any]]:
    """Stream answer text rồi emit done với payload đã finalize."""
    from app.services.ai_agent.streaming import done_event, yield_text_as_token_events

    answer = (result.get("answer") or "").strip()
    if answer:
        async for frame in yield_text_as_token_events(answer):
            yield frame

    result = dict(result)
    if response_type:
        result["response_type"] = response_type
    result["intent"] = ctx.intent.value
    if extra_finalize:
        result.update(extra_finalize)
    result = _attach_route_meta(result, ctx)
    result = _finalize_chat_response(ctx.session_id, ctx.message, ctx.intent, result)
    yield done_event(result)


async def run_chat_stream(
    message: str,
    user_id: Optional[int] = None,
    user_role: Optional[str] = None,
    session_id: Optional[str] = None,
) -> AsyncIterator[dict[str, Any]]:
    """Stream SSE frames cho toàn bộ luồng chat (mirror run_chat)."""
    from app.services.ai_agent.streaming import (
        done_event,
        error_event,
        status_event,
        yield_text_as_token_events,
    )

    ctx = await _resolve_chat_route(message, user_id, user_role, session_id)
    yield status_event("intent", "Đang phân loại yêu cầu...", intent=ctx.intent.value)

    try:
        if ctx.intent == ChatIntent.GREETING:
            result = {
                "answer": (
                    "Xin chào! Mình là trợ lý tư vấn của cửa hàng đèn đá muối Himalaya. "
                    "Mình có thể giúp bạn tìm sản phẩm, tư vấn công dụng, hoặc hỗ trợ đặt hàng. "
                    "Bạn cần hỗ trợ gì ạ?"
                ),
                "response_type": "text",
            }
            async for frame in _stream_result_payload(ctx, result, response_type="text"):
                yield frame
            return

        if ctx.intent == ChatIntent.ORDER:
            checkout_requested = _is_checkout_request(ctx.effective_message)
            if ctx.user_id is None:
                result = {
                    "answer": "Vui lòng đăng nhập để tiếp tục đặt hàng hoặc thanh toán qua chat.",
                    "cart_updated": False,
                    "cart_item": None,
                    "response_type": "text",
                }
                async for frame in _stream_result_payload(ctx, result, response_type="text"):
                    yield frame
                return

            result = await run_ordering_agent(
                ctx.message,
                ctx.user_id,
                conversation_context=ctx.conversation_context or None,
            )
            if result.get("cart_updated"):
                if checkout_requested:
                    cart_items = _normalize_checkout_cart_items(result)
                    if cart_items:
                        result["response_type"] = "checkout_form"
                        result["intent"] = "checkout"
                        result["data"] = {"cart_items": cart_items}
                    else:
                        result["answer"] = (
                            "Giỏ hàng của bạn đang trống hoặc chưa đủ dữ liệu để thanh toán."
                        )
                        result["cart_updated"] = False
                        result["response_type"] = "text"
                else:
                    result["response_type"] = "text"
            else:
                if checkout_requested:
                    result["answer"] = (
                        "Giỏ hàng của bạn đang trống. Hãy thêm sản phẩm trước khi thanh toán nhé."
                    )
                result["response_type"] = "text"
            async for frame in _stream_result_payload(
                ctx, result, response_type=result.get("response_type", "text")
            ):
                yield frame
            return

        if ctx.intent == ChatIntent.ORDER_QUERY:
            if ctx.user_id is None:
                result = {
                    "answer": "Vui lòng đăng nhập để xem đơn hàng của bạn.",
                    "response_type": "text",
                }
                async for frame in _stream_result_payload(ctx, result, response_type="text"):
                    yield frame
                return
            result = await run_order_query_agent(ctx.effective_message, ctx.user_id)
            rt = "order_detail" if result.get("order_detail") else "order_list"
            async for frame in _stream_result_payload(ctx, result, response_type=rt):
                yield frame
            return

        if ctx.intent == ChatIntent.STATS:
            if ctx.normalized_role != "admin":
                result = {
                    "answer": "Chức năng thống kê chỉ dành cho quản trị viên.",
                    "response_type": "text",
                    "stats_data": None,
                }
                async for frame in _stream_result_payload(ctx, result, response_type="text"):
                    yield frame
                return

            yield status_event("stats_query", "Đang truy vấn báo cáo...")
            result = await run_stats_agent(ctx.effective_message)
            result.setdefault("stats_data", {})
            result.setdefault("meta", {"source": result.get("meta", {}).get("source", "rest")})
            async for frame in _stream_result_payload(ctx, result, response_type="stats"):
                yield frame
            return

        if ctx.intent == ChatIntent.RECOMMEND:
            async for frame in stream_recommendation_agent(
                ctx.message,
                conversation_context=ctx.conversation_context or None,
            ):
                if frame.get("event") == "done":
                    payload = dict(frame["data"])
                    payload["intent"] = ctx.intent.value
                    payload["response_type"] = (
                        "product_cards" if payload.get("products") else "text"
                    )
                    payload = _attach_route_meta(payload, ctx)
                    payload = _finalize_chat_response(
                        ctx.session_id, ctx.message, ctx.intent, payload
                    )
                    yield done_event(payload)
                else:
                    yield frame
            return

        # KNOWLEDGE (RAG)
        from app.services.ai_agent.chains.rag_chain import (
            RAG_ERROR_ANSWER,
            stream_rag_with_sources,
        )

        try:
            async for frame in stream_rag_with_sources(ctx.effective_message):
                if frame.get("event") == "done":
                    payload = dict(frame["data"])
                    payload["intent"] = ctx.intent.value
                    payload["response_type"] = "text"
                    rag_status = payload.pop("rag_status", None)
                    if rag_status:
                        payload.setdefault("meta", {})["rag_status"] = rag_status
                    payload = _attach_route_meta(payload, ctx)
                    payload = _finalize_chat_response(
                        ctx.session_id, ctx.message, ctx.intent, payload
                    )
                    yield done_event(payload)
                else:
                    yield frame
        except Exception:
            import logging

            logging.getLogger(__name__).exception(
                "Knowledge RAG stream failed for message=%r",
                ctx.effective_message[:200],
            )
            async for frame in yield_text_as_token_events(RAG_ERROR_ANSWER):
                yield frame
            result = {
                "answer": RAG_ERROR_ANSWER,
                "sources": [],
                "response_type": "text",
            }
            result = _attach_route_meta(result, ctx)
            result = _finalize_chat_response(ctx.session_id, ctx.message, ctx.intent, result)
            yield done_event(result)

    except Exception:
        import logging
        from app.services.ai_agent.llm import get_llm_display_info

        logging.getLogger(__name__).exception("run_chat_stream failed")
        yield error_event("Hệ thống tạm thời không xử lý được tin nhắn.")
        result = {
            "answer": (
                "Hệ thống tạm thời không xử lý được tin nhắn do lỗi kỹ thuật. "
                "Bạn vui lòng thử lại sau, hoặc hỏi gợi ý sản phẩm / xem danh mục để tiếp tục mua hàng nhé."
            ),
            "response_type": "text",
            "intent": ChatIntent.KNOWLEDGE.value,
            "meta": {**get_llm_display_info(), "chat_error": True},
        }
        yield done_event(result)


# ---------------------------------------------------------------------------
# Main Chat Router
# ---------------------------------------------------------------------------
async def run_chat(
    message: str,
    user_id: Optional[int] = None,
    user_role: Optional[str] = None,
    session_id: Optional[str] = None,
) -> dict:
    """Endpoint tổng hợp — tự routing đến đúng chain/agent.

    Returns:
        dict với key "answer" và các key bổ sung tùy intent
    """
    ctx = await _resolve_chat_route(message, user_id, user_role, session_id)
    intent = ctx.intent
    effective_message = ctx.effective_message
    conversation_context = ctx.conversation_context
    normalized_role = ctx.normalized_role

    def _attach_response_meta(result: dict) -> dict:
        return _attach_route_meta(result, ctx)

    # ── GREETING ──────────────────────────────────────────────────────────
    if intent == ChatIntent.GREETING:
        result = _attach_response_meta({
            "answer": (
                "Xin chào! Mình là trợ lý tư vấn của cửa hàng đèn đá muối Himalaya. "
                "Mình có thể giúp bạn tìm sản phẩm, tư vấn công dụng, hoặc hỗ trợ đặt hàng. "
                "Bạn cần hỗ trợ gì ạ?"
            ),
            "response_type": "text",
            "intent": intent.value,
        })
        return _finalize_chat_response(session_id, message, intent, result)

    # ── ORDER ──────────────────────────────────────────────────────────────
    if intent == ChatIntent.ORDER:
        checkout_requested = _is_checkout_request(effective_message)
        if user_id is None:
            result = _attach_response_meta({
                "answer": "Vui lòng đăng nhập để tiếp tục đặt hàng hoặc thanh toán qua chat.",
                "cart_updated": False,
                "cart_item": None,
                "response_type": "text",
                "intent": intent.value,
            })
            return _finalize_chat_response(session_id, message, intent, result)

        result = await run_ordering_agent(
            message,
            user_id,
            conversation_context=conversation_context or None,
        )

        if result.get("cart_updated"):
            if checkout_requested:
                cart_items = _normalize_checkout_cart_items(result)
                if cart_items:
                    result["response_type"] = "checkout_form"
                    result["intent"] = "checkout"
                    result["data"] = {"cart_items": cart_items}
                else:
                    result["answer"] = "Giỏ hàng của bạn đang trống hoặc chưa đủ dữ liệu để thanh toán."
                    result["cart_updated"] = False
                    result["response_type"] = "text"
                    result["intent"] = intent.value
            else:
                result["response_type"] = "text"
                result["intent"] = intent.value
        else:
            if checkout_requested:
                result["answer"] = "Giỏ hàng của bạn đang trống. Hãy thêm sản phẩm trước khi thanh toán nhé."
            result["response_type"] = "text"
            result["intent"] = intent.value

        result = _attach_response_meta(result)
        return _finalize_chat_response(session_id, message, intent, result)

    # ── ORDER_QUERY ────────────────────────────────────────────────────────
    elif intent == ChatIntent.ORDER_QUERY:
        if user_id is None:
            result = _attach_response_meta({
                "answer": "Vui lòng đăng nhập để xem đơn hàng của bạn.",
                "response_type": "text",
                "intent": intent.value,
            })
            return _finalize_chat_response(session_id, message, intent, result)
        result = await run_order_query_agent(effective_message, user_id)
        result["intent"] = intent.value
        result["response_type"] = "order_detail" if result.get("order_detail") else "order_list"
        result = _attach_response_meta(result)
        return _finalize_chat_response(session_id, message, intent, result)

    # ── STATS ──────────────────────────────────────────────────────────────
    elif intent == ChatIntent.STATS:
        if normalized_role != "admin":
            result = _attach_response_meta({
                "answer": "Chức năng thống kê chỉ dành cho quản trị viên.",
                "response_type": "text",
                "intent": intent.value,
                "stats_data": None,
            })
            return _finalize_chat_response(session_id, message, intent, result)

        result = await run_stats_agent(effective_message)
        result["intent"] = intent.value
        result["response_type"] = "stats"
        result.setdefault("stats_data", {})
        result.setdefault("meta", {"source": "rest"})
        result = _attach_response_meta(result)
        return _finalize_chat_response(session_id, message, intent, result)

    # ── RECOMMEND ─────────────────────────────────────────────────────────
    elif intent == ChatIntent.RECOMMEND:
        result = await run_recommendation_agent(
            message,
            conversation_context=conversation_context or None,
        )
        result["intent"] = intent.value
        result["response_type"] = "product_cards" if result.get("products") else "text"
        result = _attach_response_meta(result)
        return _finalize_chat_response(session_id, message, intent, result)

    # ── KNOWLEDGE (default) ───────────────────────────────────────────────
    else:
        from app.services.ai_agent.chains.rag_chain import (
            RAG_ERROR_ANSWER,
            create_rag_chain_with_sources,
        )

        try:
            chain = create_rag_chain_with_sources()
            result = await chain.ainvoke({"question": effective_message})
        except Exception:
            import logging

            logging.getLogger(__name__).exception(
                "Knowledge RAG chain failed for message=%r",
                effective_message[:200],
            )
            result = {
                "answer": RAG_ERROR_ANSWER,
                "sources": [],
                "rag_status": "error",
            }

        result["intent"] = intent.value
        result["response_type"] = "text"
        rag_status = result.pop("rag_status", None)
        if rag_status:
            result.setdefault("meta", {})["rag_status"] = rag_status
        result = _attach_response_meta(result)
        return _finalize_chat_response(session_id, message, intent, result)