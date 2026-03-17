# Task 01 — Backend: Chuẩn hóa contract checkout cho chat

**Giai đoạn:** 3 - Checkout trong chat  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 1.5-2 giờ  
**File chính:** `backend/app/services/ai_agent/agent.py`  
**Phụ thuộc:** Intent checkout đã map ở phase trước

---

## Bối cảnh

Chatbot cần trả về `response_type=checkout_form` khi user muốn thanh toán trong hội thoại.  
Hiện payload trả về chưa được chuẩn hóa đủ để frontend render panel checkout ổn định.

---

## Công việc cần làm

### Bước 1 — Xác định điều kiện trả `checkout_form`

Trong luồng xử lý chat:

- Nếu intent thể hiện nhu cầu mua/thanh toán (`checkout`, `mua ngay`, `thanh toán`) và user đã đăng nhập.
- Nếu giỏ hàng có sản phẩm hợp lệ.

Khi đó trả:

```json
{
  "response_type": "checkout_form",
  "intent": "checkout",
  "answer": "Mình đã chuẩn bị thông tin thanh toán cho bạn.",
  "data": {
    "cart_items": []
  }
}
```

### Bước 2 — Chuẩn hóa schema `cart_item`

Mỗi item trong `data.cart_items` tối thiểu gồm:

- `product_id`
- `product_name`
- `product_slug`
- `image_url`
- `unit_price`
- `quantity`
- `subtotal`

Đảm bảo kiểu dữ liệu đồng nhất (`number` cho tiền/số lượng, `string` cho tên/slug/url).

### Bước 3 — Guard đăng nhập và fallback

- Nếu chưa đăng nhập: trả `response_type=text` với thông điệp yêu cầu đăng nhập.
- Nếu giỏ hàng trống: trả `response_type=text` với thông điệp giỏ hàng trống.
- Không phát sinh exception 500 cho case dữ liệu thiếu.

### Bước 4 — Giữ tương thích contract hiện có

- Không thay đổi endpoint checkout/order hiện tại.
- Chỉ bổ sung/chuẩn hóa payload cho route chat unified.

---

## Definition of Done (DoD)

- [ ] Backend trả đúng `response_type=checkout_form` cho case hợp lệ.
- [ ] `data.cart_items` đủ trường tối thiểu và không null bừa bãi.
- [ ] User chưa login hoặc cart rỗng được xử lý bằng response thân thiện.
- [ ] Không làm ảnh hưởng luồng `response_type` khác (text/product*cards/order*\*).

---

## Ghi chú

- Ưu tiên dữ liệu đã có trong DB/cart service, không gọi vòng qua HTTP nội bộ.
- Nếu chưa có đầy đủ thông tin giao hàng trong chat payload, frontend có thể kết hợp cart store để render.
