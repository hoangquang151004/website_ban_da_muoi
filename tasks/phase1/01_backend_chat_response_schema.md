# Task 01 — Backend: Chuẩn hóa ChatResponse Schema

**Giai đoạn:** 1 - Foundation & Schema  
**Ưu tiên:** 🔴 P0 — Phải làm trước, mọi task sau phụ thuộc vào đây  
**Ước lượng:** 1–2 giờ  
**File chính:** `backend/app/routers/chat.py`

---

## Bối cảnh

Hiện tại `run_chat()` trong `agent.py` trả về dict tự do, không có trường thống nhất để frontend biết **cần render gì** (text, product cards, order list...).  
Task này thêm trường `response_type` vào tất cả response để frontend dispatch đúng renderer.

---

## Công việc cần làm

### Bước 1 — Định nghĩa `ResponseType` Literal trong `chat.py`

Mở file `backend/app/routers/chat.py`, thêm type alias ngay dưới phần import:

```python
from typing import Literal

ResponseType = Literal[
    "text",           # Câu trả lời văn bản thuần / RAG knowledge
    "product_cards",  # Danh sách sản phẩm gợi ý
    "checkout_form",  # Form checkout nhúng trong chat
    "order_list",     # Danh sách đơn hàng của user
    "order_detail",   # Chi tiết 1 đơn hàng
    "stats",          # Widgets thống kê cho admin
]
```

### Bước 2 — Mở rộng `ChatResponse` schema

Cập nhật class `ChatResponse` trong `chat.py`:

```python
class ChatResponse(BaseModel):
    answer: str
    response_type: ResponseType = "text"      # <-- THÊM MỚI
    intent: Optional[str] = None
    products: Optional[list[dict]] = None
    sources: Optional[list[dict]] = None
    cart_updated: Optional[bool] = None
    cart_item: Optional[dict] = None
    orders: Optional[list[dict]] = None       # <-- THÊM MỚI (cho order_list)
    order_detail: Optional[dict] = None       # <-- THÊM MỚI (cho order_detail)
    stats_data: Optional[dict] = None         # <-- THÊM MỚI (cho stats)
```

### Bước 3 — Cập nhật `run_chat()` trong `agent.py` trả về `response_type`

Mở `backend/app/services/ai_agent/agent.py`, cập nhật từng nhánh trong `run_chat()`:

```python
# Nhánh ORDER:
result["response_type"] = "checkout_form"   # khi thêm vào cart thành công
# hoặc "text" khi lỗi

# Nhánh RECOMMEND:
result["response_type"] = "product_cards" if result.get("products") else "text"

# Nhánh KNOWLEDGE (default):
result["response_type"] = "text"
```

> **Lưu ý:** Các intent mới `ORDER_QUERY` và `STATS` sẽ xử lý trong Task 02.

---

## JSON Contract v1 (Output mẫu)

### Trả lời văn bản (RAG/CSKH):

```json
{
  "answer": "Đèn đá muối giúp lọc không khí...",
  "response_type": "text",
  "intent": "knowledge",
  "sources": [{ "title": "Công dụng đèn đá muối", "snippet": "..." }]
}
```

### Gợi ý sản phẩm:

```json
{
  "answer": "Mình gợi ý 3 sản phẩm phù hợp với bạn:",
  "response_type": "product_cards",
  "intent": "recommend",
  "products": [
    {
      "id": 1,
      "name": "Đèn đá muối cầu",
      "price": 450000,
      "image_url": "...",
      "slug": "den-da-muoi-cau",
      "stock": 20,
      "short_description": "Thư giãn, lọc không khí"
    }
  ]
}
```

### Đặt hàng qua chat:

```json
{
  "answer": "Đã thêm vào giỏ hàng! Bạn muốn thanh toán ngay không?",
  "response_type": "checkout_form",
  "intent": "order",
  "cart_updated": true,
  "cart_item": { "product_id": 1, "quantity": 2, "unit_price": 450000 }
}
```

### Danh sách đơn hàng:

```json
{
  "answer": "Đây là các đơn hàng gần nhất của bạn:",
  "response_type": "order_list",
  "intent": "order_query",
  "orders": [
    {
      "id": 42,
      "status": "pending",
      "total_amount": 900000,
      "created_at": "2026-03-01"
    }
  ]
}
```

### Thống kê (admin):

```json
{
  "answer": "Doanh thu tháng này:",
  "response_type": "stats",
  "intent": "stats",
  "stats_data": {
    "total_revenue": 15000000,
    "total_orders": 45,
    "top_products": [...]
  }
}
```

---

## Definition of Done (DoD)

- [ ] `ChatResponse` có trường `response_type` với default `"text"`.
- [ ] `run_chat()` luôn trả về `response_type` phù hợp với từng nhánh intent.
- [ ] Gọi `POST /api/v1/chat` với message bất kỳ → response JSON luôn có key `response_type`.
- [ ] Unit test nhanh: import `ChatResponse`, khởi tạo không có `response_type` → default là `"text"`.

---

## Ghi chú

- Không thay đổi logic xử lý AI, chỉ thêm field vào kết quả trả về.
- `response_type` là **contract** với frontend — sau khi xong, không được đổi tên các giá trị Literal.
- File này là điều kiện tiên quyết của Task 03 (Frontend TypeScript types).
