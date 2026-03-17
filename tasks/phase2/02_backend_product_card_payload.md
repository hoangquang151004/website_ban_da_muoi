# Task 02 — Backend: Bổ sung payload cho Product Card trong chat

**Giai đoạn:** 2 - Tư vấn sản phẩm & CSKH  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 1–2 giờ  
**File chính:** `backend/app/services/ai_agent/tools/product_search.py`

---

## Bối cảnh

Frontend cần render product card tương tác với tối thiểu các field:

- `id`
- `name`
- `price`
- `image_url`
- `slug`
- `stock`
- `short_description`

Hiện `search_products_structured()` mới trả về:

- `id`
- `name`
- `price`
- `original_price`
- `image_url`
- `stock`
- `uses`

Như vậy **chưa đủ** để render card đẹp và xử lý các action `Xem chi tiết`, `Mua ngay`.

---

## Công việc cần làm

### Bước 1 — Mở rộng output của `search_products_structured()`

Trong `backend/app/services/ai_agent/tools/product_search.py`, cập nhật mỗi product dict:

```python
output.append({
    "id": p.id,
    "name": p.name,
    "slug": p.slug,
    "price": float(p.price),
    "original_price": float(p.original_price) if p.original_price else None,
    "image_url": p.image_url,
    "stock": p.stock,
    "short_description": (p.description[:120] + "...") if p.description and len(p.description) > 120 else p.description,
    "uses": [{"id": u.id, "name": u.name} for u in p.uses],
})
```

### Bước 2 — Đảm bảo `run_recommendation_agent()` giữ nguyên response_type `product_cards`

Không đổi contract cũ, chỉ enrich dữ liệu.

### Bước 3 — Kiểm tra tính tương thích ngược

Các test cũ chỉ check `price`, `name`, `products`; việc thêm field mới không được làm hỏng test hiện có.

---

## JSON mẫu mong muốn

```json
{
  "answer": "Mình gợi ý 3 mẫu phù hợp cho phòng ngủ:",
  "response_type": "product_cards",
  "intent": "recommend",
  "products": [
    {
      "id": 1,
      "name": "Đèn đá muối cầu",
      "slug": "den-da-muoi-cau",
      "price": 450000,
      "original_price": 550000,
      "image_url": "http://localhost:8000/static/uploads/salt-lamp.jpg",
      "stock": 12,
      "short_description": "Ánh sáng dịu nhẹ, hỗ trợ thư giãn và cải thiện giấc ngủ.",
      "uses": [{ "id": 2, "name": "Mất ngủ" }]
    }
  ]
}
```

---

## Definition of Done (DoD)

- [ ] `search_products_structured()` trả thêm `slug` và `short_description`.
- [ ] `products[0]` luôn có đủ field frontend cần dùng.
- [ ] Test `run_recommendation_agent()` vẫn pass.
- [ ] Không thay đổi logic sắp xếp và filter sản phẩm hiện có.

---

## Ghi chú

- `short_description` chỉ là field hiển thị trong chat; không thay thế `description` đầy đủ ở trang chi tiết.
- Không cần thêm schema Pydantic mới ở phase này nếu router vẫn trả `BaseResponse.success(data=result)`.
