# Task 02 — Backend: Mở rộng Intent Map

**Giai đoạn:** 1 - Foundation & Schema  
**Ưu tiên:** 🔴 P0 — Song song hoặc ngay sau Task 01  
**Ước lượng:** 1–2 giờ  
**File chính:** `backend/app/services/ai_agent/agent.py`

---

## Bối cảnh

`ChatIntent` hiện có 3 giá trị: `ORDER`, `RECOMMEND`, `KNOWLEDGE`.  
Chatbot cần xử lý thêm 2 loại hội thoại mới:

- **`ORDER_QUERY`** — User hỏi về đơn hàng của mình ("đơn hàng của tôi", "đơn #42 đang ở đâu").
- **`STATS`** — Admin hỏi về số liệu kinh doanh ("doanh thu tháng này", "top sản phẩm bán chạy").

---

## Công việc cần làm

### Bước 1 — Thêm 2 giá trị mới vào `ChatIntent` enum

```python
class ChatIntent(str, Enum):
    ORDER        = "order"        # Mua / thêm vào giỏ
    RECOMMEND    = "recommend"    # Tìm / gợi ý sản phẩm
    KNOWLEDGE    = "knowledge"    # Tư vấn kiến thức (RAG)
    ORDER_QUERY  = "order_query"  # Xem / tra cứu đơn hàng  ← THÊM
    STATS        = "stats"        # Hỏi thống kê kinh doanh  ← THÊM
```

### Bước 2 — Cập nhật `detect_intent()` với keyword lists mới

Thêm 2 keyword list và cập nhật logic phân loại:

```python
_ORDER_QUERY_KEYWORDS = [
    "đơn hàng của tôi", "đơn của tôi", "lịch sử đơn", "đơn #",
    "đơn số", "xem đơn", "tra đơn", "trạng thái đơn",
    "theo dõi đơn", "đơn hàng gần đây", "kiểm tra đơn",
    "đơn hàng đang ở đâu", "my order", "order của tôi",
]

_STATS_KEYWORDS = [
    "doanh thu", "thống kê", "báo cáo", "revenue",
    "top sản phẩm", "sản phẩm bán chạy", "số đơn",
    "tổng đơn", "tổng doanh thu", "kpi", "hôm nay bán được",
    "tuần này", "tháng này bán", "tỷ lệ đơn",
]
```

**Thứ tự ưu tiên trong `detect_intent()` (quan trọng — tránh false positive):**

```
1. ORDER_QUERY  (có "đơn" + "của tôi/xem/tra" → ưu tiên cao)
2. STATS        (có từ khóa báo cáo)
3. RECOMMEND    (đã có)
4. ORDER        (đã có)
5. KNOWLEDGE    (default)
```

> ⚠️ Phải kiểm tra `ORDER_QUERY` **trước** `ORDER` vì câu "xem đơn hàng tôi muốn mua" có thể trigger cả hai.

### Bước 3 — Thêm handler cho 2 intent mới trong `run_chat()`

```python
elif intent == ChatIntent.ORDER_QUERY:
    if user_id is None:
        return {
            "answer": "Vui lòng đăng nhập để xem đơn hàng của bạn.",
            "response_type": "text",
            "intent": intent.value,
        }
    result = await run_order_query_agent(message, user_id)
    result["intent"] = intent.value
    result["response_type"] = "order_list"  # hoặc "order_detail" tùy context
    return result

elif intent == ChatIntent.STATS:
    # Ghi chú: stats handler sẽ implement đầy đủ ở Giai đoạn 5
    # Phase 1 chỉ cần trả về response_type đúng, logic stub tạm thời
    return {
        "answer": "Chức năng thống kê đang được phát triển.",
        "response_type": "stats",
        "intent": intent.value,
        "stats_data": None,
    }
```

### Bước 4 — Tạo stub `run_order_query_agent()` (sẽ hoàn thiện ở Giai đoạn 4)

```python
async def run_order_query_agent(message: str, user_id: int) -> dict:
    """
    Stub cho Phase 1. Sẽ hoàn thiện ở Giai đoạn 4.
    Phase 1 chỉ cần trả về đúng shape để frontend test render.
    """
    return {
        "answer": "Đang tra cứu đơn hàng của bạn...",
        "orders": [],          # list rỗng — Phase 4 sẽ điền dữ liệu thật
        "order_detail": None,
    }
```

---

## Kiểm tra thủ công

Sau khi xong, test nhanh trong Python shell:

```python
from app.services.ai_agent.agent import detect_intent, ChatIntent

assert detect_intent("xem đơn hàng của tôi") == ChatIntent.ORDER_QUERY
assert detect_intent("doanh thu tháng này") == ChatIntent.STATS
assert detect_intent("gợi ý đèn cho phòng ngủ") == ChatIntent.RECOMMEND
assert detect_intent("mua 2 cái đèn cầu") == ChatIntent.ORDER
assert detect_intent("đèn đá muối có tác dụng gì") == ChatIntent.KNOWLEDGE
```

---

## Definition of Done (DoD)

- [ ] `ChatIntent` có đủ 5 giá trị.
- [ ] `detect_intent()` phân loại đúng 5 test case ở trên.
- [ ] `run_chat()` xử lý đủ 5 nhánh, luôn trả về `response_type`.
- [ ] `run_order_query_agent()` stub tạo xong, trả về đúng shape `{answer, orders, order_detail}`.
- [ ] Không phá vỡ các test hiện có trong `tests/test_ai_agent.py`.

---

## Ghi chú

- Keyword list có thể mở rộng sau; Phase 1 chỉ cần đủ để test cơ bản.
- `run_order_query_agent()` là **stub** — logic thật gọi `GET /orders/my` sẽ implement ở Giai đoạn 4.
- `STATS` handler cũng là stub — Giai đoạn 5 sẽ nối với `admin_statistics` service.
- File này phụ thuộc Task 01 (`response_type` đã định nghĩa).
