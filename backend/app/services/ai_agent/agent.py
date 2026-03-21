"""
agent.py — LangGraph Agent orchestration.

Gồm:
- intent_detector(): phân loại intent từ câu chat
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
from collections import deque
from datetime import date, timedelta
from enum import Enum
from typing import Optional


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


# ---------------------------------------------------------------------------
# Keyword lists
# ---------------------------------------------------------------------------

# FIX #7: GREETING — phản hồi nhanh, không qua RAG
_GREETING_KEYWORDS = [
    "xin chào", "chào shop", "chào bạn", "chào mình", "chào em",
    "hello", "hi shop", "hey", "alo", "good morning", "good evening",
]

# FIX #8: KNOWLEDGE fast-path cho domain đèn đá muối
# Được check TRƯỚC regex giá để tránh bị RECOMMEND override nhầm
_KNOWLEDGE_KEYWORDS = [
    "công dụng", "tác dụng", "lợi ích", "có tốt không", "có tác dụng không",
    "cách dùng", "hướng dẫn sử dụng", "để ở đâu", "đặt ở đâu",
    "phong thủy", "ion âm", "không khí", "thanh lọc",
    "himalaya là gì", "đá muối là gì", "đèn đá muối là gì",
    "nên đặt", "bảo quản", "vệ sinh đèn", "lau đèn",
    "sức khỏe", "chữa bệnh", "ngủ ngon", "stress",
    "khác nhau", "so sánh loại", "ưu điểm", "nhược điểm",
    "có an toàn không", "có độc không", "xuất xứ",
    "uy tín không", "chất lượng không", "đảm bảo không",
    "mua ở đây", "ship như thế nào", "giao hàng bao lâu",
    "đổi trả", "bảo hành", "chính sách",
]

# FIX #2: Bỏ "mua" đơn lẻ — quá rộng ("mua ở đây uy tín không?" → sai ORDER)
# FIX #3: Bỏ "order" đơn lẻ — "order này đâu rồi?" phải vào ORDER_QUERY
_ORDER_KEYWORDS = [
    "thêm vào giỏ", "thêm giỏ", "thêm vào cart",
    "đặt hàng ngay", "mua ngay", "cho mình mua", "tôi cần mua",
    "order giùm", "mua giùm", "chốt đơn", "checkout",
    "xóa khỏi giỏ", "xóa khỏi giỏ hàng", "xóa sản phẩm khỏi giỏ",
    "bỏ khỏi giỏ", "remove from cart", "xoa khoi gio", "bo khoi gio",
]

# FIX #4: Bỏ "tìm đèn" generic → thay bằng domain-specific
_RECOMMEND_KEYWORDS = [
    "gợi ý", "recommend", "tìm giúp", "tìm cho",
    "tư vấn mua", "nên mua gì", "chọn sản phẩm", "sản phẩm nào",
    "loại nào tốt", "cái nào tốt", "gợi ý sản phẩm", "tìm sản phẩm",
    "cần sản phẩm", "đang tìm",
    # Domain-specific (không gây nhầm với đèn pin / đèn ngủ khác)
    "tìm đèn đá", "tìm đèn muối", "tìm đèn himalaya",
    "đèn đá muối nào", "đèn himalaya nào", "đèn muối nào",
    "loại đèn đá", "size nào phù hợp", "kg nào tốt",
    "đèn nào phù hợp", "đèn nào tốt",
]

# FIX #6: Bỏ "trạng thái đơn" khỏi đây — conflict với STATS admin
# FIX #3: Thêm "order này/đó" để bắt "order này của tôi đâu?"
# Thêm xem giỏ hàng
_ORDER_QUERY_KEYWORDS = [
    "đơn hàng của tôi", "đơn của tôi", "lịch sử đơn", "đơn #",
    "đơn số", "xem đơn", "tra đơn",
    "theo dõi đơn", "đơn hàng gần đây", "kiểm tra đơn",
    "đơn hàng đang ở đâu", "my order", "order của tôi",
    "order này", "order đó", "đơn này", "đơn đó",
    # Xem giỏ hàng
    "xem giỏ hàng", "giỏ hàng của tôi", "giỏ hàng hiện tại",
    "trong giỏ có gì", "giỏ có gì",
]

# FIX #5: Bỏ "tuần này" đơn lẻ — quá rộng ("tuần này có sale không?" → sai STATS)
# Giữ các cụm từ có ngữ cảnh kinh doanh rõ ràng
_STATS_KEYWORDS = [
    "doanh thu", "thống kê", "báo cáo", "revenue",
    "top sản phẩm", "sản phẩm bán chạy", "số đơn",
    "tổng đơn", "tổng doanh thu", "kpi",
    "hôm nay bán được", "tháng này bán", "tuần này bán",
    "tỷ lệ đơn", "lợi nhuận", "doanh số",
]

_FOLLOWUP_HINT_KEYWORDS = [
    "cái đó", "mẫu đó", "loại đó", "sản phẩm đó", "nó",
    "cái này", "mẫu này", "vừa rồi", "như vậy", "thế còn",
    "đơn đó", "cái đầu tiên", "cái thứ", "món đó",
]

_CHECKOUT_HINT_KEYWORDS = [
    "checkout", "thanh toán", "mua ngay", "chốt đơn", "đặt đơn",
]

_ORDER_REGEX_PATTERNS = [
    # Có dấu đầy đủ
    r"\bth[eê]m\b.*\b(v[aà]o\s+)?gi[oỏ]\s+h[aà]ng\b",
    r"\b(add|them)\b.*\b(cart|gio\s*hang)\b",
    r"\bx[oó]a\b.*\bkh[oỏ]i\s+gi[oỏ](\s*h[aà]ng)?\b",
    r"\bb[oỏ]\b.*\bkh[oỏ]i\s+gi[oỏ](\s*h[aà]ng)?\b",
    r"\bremove\b.*\bfrom\s+cart\b",
]

# FIX #9: Regex không dấu cho mobile (gõ nhanh thiếu dấu)
_ORDER_REGEX_PATTERNS_NO_ACCENT = [
    r"\bthem\b.*\bgio\s*hang\b",
    r"\b(add|them)\b.*\b(cart|gio\s*hang)\b",
    r"\bmua\b.*\bgio\s*hang\b",
    r"\bxoa\b.*\bkhoi\s+gio(\s*hang)?\b",
    r"\bbo\b.*\bkhoi\s+gio(\s*hang)?\b",
]

# Session memory nhẹ cho hội thoại multi-turn theo session_id.
_SESSION_MEMORY: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------
def _strip_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt — dùng để match câu gõ nhanh không dấu."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def _normalize_text_for_match(text: str) -> str:
    normalized = unicodedata.normalize("NFD", (text or "").lower())
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------
def _should_apply_context(message: str) -> bool:
    msg = message.lower().strip()
    # Chỉ áp context khi câu hỏi thể hiện rõ follow-up mơ hồ.
    # Tránh việc câu ngắn nhưng độc lập (vd: "công dụng đèn đá muối")
    # bị kéo theo intent của lượt chat trước.
    if not msg:
        return False
    return any(kw in msg for kw in _FOLLOWUP_HINT_KEYWORDS)


def _contextualize_message(message: str, session_id: Optional[str]) -> str:
    if not session_id:
        return message

    session = _SESSION_MEMORY.get(session_id)
    if not session:
        return message

    prev_messages = session.get("last_user_messages") or []
    if not prev_messages or not _should_apply_context(message):
        return message

    last_user_message = prev_messages[-1]
    last_products = session.get("last_products") or []
    product_names = ", ".join(p.get("name", "") for p in last_products[:3] if p.get("name"))

    context_parts = [f"Nguyen canh truoc do cua khach: {last_user_message}."]
    if product_names:
        context_parts.append(f"San pham vua goi y: {product_names}.")

    context_parts.append(f"Yeu cau hien tai: {message}")
    return " ".join(context_parts)


def _update_session_memory(
    session_id: Optional[str],
    user_message: str,
    intent: ChatIntent,
    result: dict,
) -> None:
    if not session_id:
        return

    session = _SESSION_MEMORY.get(session_id)
    if session is None:
        session = {"last_user_messages": deque(maxlen=5), "last_products": []}
        _SESSION_MEMORY[session_id] = session

    session["last_user_messages"].append(user_message)
    session["last_intent"] = intent.value
    if isinstance(result.get("products"), list):
        session["last_products"] = result.get("products") or []


def _normalize_user_role(user_role: object) -> Optional[str]:
    if user_role is None:
        return None

    role_value = getattr(user_role, "value", user_role)
    normalized = str(role_value).strip().lower()

    # Fallback cho trường hợp enum stringify thành "UserRole.admin".
    if "." in normalized:
        normalized = normalized.rsplit(".", 1)[-1]

    return normalized or None


# ---------------------------------------------------------------------------
# Intent Detection
# ---------------------------------------------------------------------------
def detect_intent(message: str) -> ChatIntent:
    """Phân loại intent từ câu chat của user.

    Thứ tự ưu tiên (từ cao xuống thấp):
    1. GREETING  — câu chào ngắn, không qua RAG
    2. ORDER_QUERY — tra cứu đơn / giỏ hàng (trước ORDER tránh false positive)
    3. STATS     — từ khóa báo cáo / kinh doanh rõ ràng
    4. KNOWLEDGE — fast-path domain đá muối (trước RECOMMEND/ORDER)
    5. RECOMMEND — tìm / gợi ý sản phẩm
    6. ORDER     — mua / thêm / xóa giỏ (keyword + regex có dấu + regex không dấu)
    7. RECOMMEND — fallback khi đề cập ngân sách kèm con số cụ thể
    8. KNOWLEDGE — default
    """
    msg_lower = message.lower().strip()
    msg_no_accent = _strip_accents(msg_lower)

    # 1. GREETING — câu ngắn chứa từ chào hỏi
    # FIX #7: Tránh gọi RAG chain lãng phí
    if len(msg_lower) < 40 and any(kw in msg_lower for kw in _GREETING_KEYWORDS):
        return ChatIntent.GREETING

    # 2. ORDER_QUERY — ưu tiên cao để tránh "order này" → ORDER nhầm
    for kw in _ORDER_QUERY_KEYWORDS:
        if kw in msg_lower:
            return ChatIntent.ORDER_QUERY

    # 3. STATS
    for kw in _STATS_KEYWORDS:
        if kw in msg_lower:
            return ChatIntent.STATS

    # 4. KNOWLEDGE fast-path — domain đá muối
    # FIX #8: Check trước RECOMMEND/ORDER để tránh regex giá override
    # Ví dụ: "công dụng đèn đá muối giá bao nhiêu?" → KNOWLEDGE, không phải RECOMMEND
    for kw in _KNOWLEDGE_KEYWORDS:
        if kw in msg_lower:
            return ChatIntent.KNOWLEDGE

    # 5. RECOMMEND
    for kw in _RECOMMEND_KEYWORDS:
        if kw in msg_lower:
            return ChatIntent.RECOMMEND

    # 6a. ORDER — keyword
    for kw in _ORDER_KEYWORDS:
        if kw in msg_lower:
            return ChatIntent.ORDER

    # 6b. ORDER — regex có dấu
    for pattern in _ORDER_REGEX_PATTERNS:
        if re.search(pattern, msg_lower):
            return ChatIntent.ORDER

    # 6c. ORDER — regex không dấu (FIX #9: mobile gõ nhanh)
    for pattern in _ORDER_REGEX_PATTERNS_NO_ACCENT:
        if re.search(pattern, msg_no_accent):
            return ChatIntent.ORDER

    # 7. RECOMMEND fallback — đề cập ngân sách kèm CON SỐ cụ thể
    # FIX #1: Bỏ "giá" đơn lẻ, bỏ "dưới/tầm/khoảng" đơn lẻ
    # Chỉ trigger khi CÓ SỐ đi kèm để tránh "giá có đắt không?" → RECOMMEND
    if re.search(r"\d+k\b|\d{3,}\s*(?:đồng|vnd|đ)\b|dưới\s*\d|tầm\s*\d|khoảng\s*\d|\d+\s*triệu", msg_lower):
        return ChatIntent.RECOMMEND

    # 8. Default
    return ChatIntent.KNOWLEDGE


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
async def run_recommendation_agent(message: str) -> dict:
    """Phân tích câu chat, tìm sản phẩm và trả về answer + products list.

    Returns:
        {"answer": str, "products": list[dict]}
    """
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from app.services.ai_agent.llm import get_llm
    from app.services.ai_agent.tools.product_search import search_products_structured

    max_price = _extract_max_price(message)
    min_price = _extract_min_price(message)

    products = await search_products_structured(
        query=message,
        max_price=max_price,
        min_price=min_price,
    )

    llm = get_llm()
    if products:
        product_list_text = "\n".join(
            f"- {i+1}. {p['name']} — {int(p['price']):,}đ"
            for i, p in enumerate(products)
        )
        summary_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "Bạn là trợ lý tư vấn bán hàng đèn đá muối Himalaya. "
                "Hãy viết câu trả lời thân thiện, ngắn gọn giới thiệu danh sách sản phẩm cho khách.",
            ),
            ("human", f"Khách hỏi: {message}\n\nDanh sách sản phẩm tìm được:\n{product_list_text}"),
        ])
        try:
            answer = await (summary_prompt | llm | StrOutputParser()).ainvoke({})
        except Exception:
            # Fallback an toàn để không làm vỡ luồng chat khi provider lỗi tạm thời.
            answer = "Mình tìm được một số sản phẩm phù hợp cho bạn. Bạn xem danh sách bên dưới nhé."
    else:
        answer = (
            "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn. "
            "Bạn có thể mô tả thêm nhu cầu hoặc điều chỉnh ngân sách không?"
        )

    return {"answer": answer, "products": products}


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
    return any(kw in msg for kw in _CHECKOUT_HINT_KEYWORDS)


def _is_remove_from_cart_request(message: str) -> bool:
    msg = (message or "").lower()
    direct_keywords = [
        "xóa khỏi giỏ", "xóa khỏi giỏ hàng", "bỏ khỏi giỏ",
        "xoa khoi gio", "bo khoi gio", "remove from cart",
    ]
    if any(kw in msg for kw in direct_keywords):
        return True

    patterns = [
        r"\bx[oó]a\b.*\bkh[oỏ]i\s+gi[oỏ](\s*h[aà]ng)?\b",
        r"\bb[oỏ]\b.*\bkh[oỏ]i\s+gi[oỏ](\s*h[aà]ng)?\b",
        r"\bremove\b.*\bfrom\s+cart\b",
    ]
    return any(re.search(pattern, msg) for pattern in patterns)


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
async def run_ordering_agent(message: str, user_id: int) -> dict:
    """Xử lý yêu cầu đặt hàng qua chat.

    Flow:
    1. Trích xuất số lượng + tên sản phẩm
    2. Tìm sản phẩm khớp nhất
    3. Gọi add_to_cart_tool (hoặc remove nếu là yêu cầu xóa)
    4. Trả lời user

    Returns:
        {"answer": str, "cart_updated": bool, "cart_item": dict | None}
    """
    from app.services.ai_agent.tools.product_search import search_products_structured
    from app.services.ai_agent.tools.add_to_cart import add_to_cart_internal

    quantity = _extract_quantity(message)
    is_remove_request = _is_remove_from_cart_request(message)
    requested_product_name = _extract_requested_product_name(message)

    selected_product: dict | None = None
    if requested_product_name:
        selected_product = await _find_best_product_by_name(requested_product_name)

    products = await search_products_structured(query=message, max_price=None, min_price=None)

    if selected_product is None and requested_product_name and products:
        ranked = sorted(
            products,
            key=lambda p: _score_product_name_match(p.get("name", ""), requested_product_name),
            reverse=True,
        )
        if ranked:
            top_score = _score_product_name_match(ranked[0].get("name", ""), requested_product_name)
            if top_score >= 0.55:
                selected_product = ranked[0]

    if selected_product is None and products:
        selected_product = products[0]

    if selected_product is None:
        return {
            "answer": "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp. Bạn có thể mô tả thêm không?",
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


def _extract_requested_product_name(message: str) -> Optional[str]:
    text = (message or "").strip()
    if not text:
        return None

    patterns = [
        r"th[eê]m\s+(.+?)\s+v[aà]o\s+gi[oỏ]\s*h[aà]ng",
        r"th[eê]m\s+(.+?)\s+v[aà]o\s+gi[oỏ]",
        r"mua\s+(.+?)\s+(?:v[aà]o\s+gi[oỏ]|thanh\s*to[aá]n|checkout)",
        r"x[oó]a\s+(.+?)\s+kh[oỏ]i\s+gi[oỏ]\s*h[aà]ng",
        r"x[oó]a\s+(.+?)\s+kh[oỏ]i\s+gi[oỏ]",
        r"b[oỏ]\s+(.+?)\s+kh[oỏ]i\s+gi[oỏ]\s*h[aà]ng",
        r"b[oỏ]\s+(.+?)\s+kh[oỏ]i\s+gi[oỏ]",
        r"remove\s+(.+?)\s+from\s+cart",
    ]

    lower = text.lower()
    for pattern in patterns:
        match = re.search(pattern, lower)
        if not match:
            continue

        candidate = match.group(1).strip(" ,.!?\"'")
        candidate = re.sub(r"^(\d+)\s*(c[aá]i|chi[eế]c|b[oộ]|đ[eè]n)\s+", "", candidate)
        candidate = re.sub(r"\s+x\s*\d+\s*$", "", candidate)
        candidate = candidate.strip()
        if candidate:
            return candidate

    return None


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
    from sqlalchemy import and_, select
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker

    from app.core.config import settings
    from app.models.product import Product

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            result = await session.execute(
                select(Product)
                .where(and_(Product.is_active == True, Product.stock > 0))  # noqa: E712
                .limit(300)
            )
            products = result.scalars().all()

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
    finally:
        await engine.dispose()


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
    effective_message = _contextualize_message(message, session_id)
    normalized_role = _normalize_user_role(user_role)
    intent = detect_intent(effective_message)

    # Override 1: Admin hỏi dạng báo cáo/phân tích nhưng không trúng keyword cứng
    # vẫn phải vào luồng STATS thay vì rơi xuống RAG.
    if (
        intent == ChatIntent.KNOWLEDGE
        and normalized_role == "admin"
        and _looks_like_admin_stats_query(effective_message)
    ):
        intent = ChatIntent.STATS

    # Override 2 (FIX #6): Admin hỏi "trạng thái đơn" → detect_intent trả ORDER_QUERY
    # nhưng với admin thì đây là câu hỏi STATS (phân bố đơn theo trạng thái).
    if (
        intent == ChatIntent.ORDER_QUERY
        and normalized_role == "admin"
        and _looks_like_admin_stats_query(effective_message)
    ):
        intent = ChatIntent.STATS

    # ── GREETING ──────────────────────────────────────────────────────────
    if intent == ChatIntent.GREETING:
        result = {
            "answer": (
                "Xin chào! Mình là trợ lý tư vấn của cửa hàng đèn đá muối Himalaya. "
                "Mình có thể giúp bạn tìm sản phẩm, tư vấn công dụng, hoặc hỗ trợ đặt hàng. "
                "Bạn cần hỗ trợ gì ạ?"
            ),
            "response_type": "text",
            "intent": intent.value,
        }
        _update_session_memory(session_id, message, intent, result)
        return result

    # ── ORDER ──────────────────────────────────────────────────────────────
    if intent == ChatIntent.ORDER:
        checkout_requested = _is_checkout_request(effective_message)
        if user_id is None:
            result = {
                "answer": "Vui lòng đăng nhập để tiếp tục đặt hàng hoặc thanh toán qua chat.",
                "cart_updated": False,
                "cart_item": None,
                "response_type": "text",
                "intent": intent.value,
            }
            _update_session_memory(session_id, message, intent, result)
            return result

        result = await run_ordering_agent(effective_message, user_id)

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

        _update_session_memory(session_id, message, intent, result)
        return result

    # ── ORDER_QUERY ────────────────────────────────────────────────────────
    elif intent == ChatIntent.ORDER_QUERY:
        if user_id is None:
            result = {
                "answer": "Vui lòng đăng nhập để xem đơn hàng của bạn.",
                "response_type": "text",
                "intent": intent.value,
            }
            _update_session_memory(session_id, message, intent, result)
            return result
        result = await run_order_query_agent(effective_message, user_id)
        result["intent"] = intent.value
        result["response_type"] = "order_detail" if result.get("order_detail") else "order_list"
        _update_session_memory(session_id, message, intent, result)
        return result

    # ── STATS ──────────────────────────────────────────────────────────────
    elif intent == ChatIntent.STATS:
        if normalized_role != "admin":
            result = {
                "answer": "Chức năng thống kê chỉ dành cho quản trị viên.",
                "response_type": "text",
                "intent": intent.value,
                "stats_data": None,
            }
            _update_session_memory(session_id, message, intent, result)
            return result

        result = await run_stats_agent(effective_message)
        result["intent"] = intent.value
        result["response_type"] = "stats"
        result.setdefault("stats_data", {})
        result.setdefault("meta", {"source": "rest"})
        _update_session_memory(session_id, message, intent, result)
        return result

    # ── RECOMMEND ─────────────────────────────────────────────────────────
    elif intent == ChatIntent.RECOMMEND:
        result = await run_recommendation_agent(effective_message)
        result["intent"] = intent.value
        result["response_type"] = "product_cards" if result.get("products") else "text"
        _update_session_memory(session_id, message, intent, result)
        return result

    # ── KNOWLEDGE (default) ───────────────────────────────────────────────
    else:
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": effective_message})
        result["intent"] = intent.value
        result["response_type"] = "text"
        _update_session_memory(session_id, message, intent, result)
        return result