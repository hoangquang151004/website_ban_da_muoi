# Task 01 — Backend: Implement `run_order_query_agent()` cho chat

**Giai đoạn:** 4 - Quản lý đơn hàng  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2 giờ  
**File chính:** `backend/app/services/ai_agent/agent.py`  
**Phụ thuộc:** Giai đoạn 1 đã có `ChatIntent.ORDER_QUERY` và `response_type`

---

## Bối cảnh

Backend đã có sẵn:

- `GET /api/v1/orders/my`
- `GET /api/v1/orders/{order_id}`
- CRUD/service `list_user_orders()` và `get_order_by_id()`

Nhưng chatbot vẫn chưa có handler để gọi các luồng này khi user hỏi kiểu:

- "đơn hàng của tôi"
- "xem đơn gần đây"
- "chi tiết đơn 42"
- "đơn #42 đang ở đâu"

Task này hiện thực hóa nhánh `ORDER_QUERY` trong `agent.py`.

---

## Công việc cần làm

### Bước 1 — Thêm helper parse order id từ message

Trong `agent.py`, thêm helper:

```python
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
```

### Bước 2 — Implement `run_order_query_agent(message, user_id)`

Handler cần phân 2 nhánh:

#### Nhánh A — Có `order_id`

- Gọi trực tiếp `order_crud.get_order_by_id()`.
- Nếu đơn không tồn tại → trả lời text lỗi thân thiện.
- Nếu đơn không thuộc user hiện tại → trả lời từ chối truy cập.
- Nếu hợp lệ → trả về:

```python
{
    "answer": f"Đây là chi tiết đơn hàng #{order.id}.",
    "order_detail": {...},
    "orders": None,
}
```

#### Nhánh B — Không có `order_id`

- Gọi `order_crud.list_user_orders(db, user_id=user_id, page=1, limit=5)`.
- Trả về danh sách rút gọn:

```python
{
    "answer": "Đây là các đơn hàng gần nhất của bạn.",
    "orders": [...],
    "order_detail": None,
}
```

### Bước 3 — Map đúng `response_type`

Trong `run_chat()`:

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
    result["response_type"] = "order_detail" if result.get("order_detail") else "order_list"
    return result
```

### Bước 4 — Chuẩn hóa payload trả về

`orders` trong `order_list` nên có tối thiểu:

- `id`
- `status`
- `total_amount`
- `created_at`
- `items_count`
- `first_item_name`
- `first_item_image_url`

`order_detail` nên có:

- Thông tin người nhận
- `payment_method`
- `status`
- `total_amount`
- Danh sách items với `product_name`, `image_url`, `quantity`, `unit_price`, `subtotal`, `product_slug`

---

## Definition of Done (DoD)

- [ ] `run_order_query_agent()` xử lý được list và detail.
- [ ] `run_chat()` trả đúng `response_type = order_list | order_detail`.
- [ ] User chưa đăng nhập hỏi đơn hàng → bot trả lời yêu cầu đăng nhập.
- [ ] User hỏi `đơn #ID` của người khác → không lộ dữ liệu.
- [ ] Không thay đổi contract của endpoints orders hiện có.

---

## Ghi chú

- Nên gọi trực tiếp `order_crud` ở backend thay vì gọi HTTP lại vào router.
- Logic parse `order_id` phải đơn giản, không cần LLM chain cho phase này.
- Nếu message chỉ hỏi "đơn hàng đang ở đâu" mà không có ID, mặc định trả list 5 đơn gần nhất.
