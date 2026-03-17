# Task 04 — Frontend: Render `order_detail` panel trong Chatbot

**Giai đoạn:** 4 - Quản lý đơn hàng  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2–3 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`

---

## Bối cảnh

Sau khi user chọn `Xem chi tiết`, chatbot cần hiển thị đầy đủ thông tin đơn hàng ngay trong chat mà không buộc chuyển trang.

---

## Công việc cần làm

### Bước 1 — Tạo `OrderDetailPanel`

Props:

```ts
function OrderDetailPanel({
  order,
  onReorder,
}: {
  order?: ChatOrderDetail;
  onReorder: (order: ChatOrderDetail) => void;
});
```

### Bước 2 — Nội dung hiển thị tối thiểu

Panel cần có:

- Mã đơn
- Trạng thái đơn
- Ngày tạo
- Người nhận / số điện thoại / địa chỉ
- Phương thức thanh toán
- Ghi chú nếu có
- Danh sách item
- Tổng tiền

Mỗi item hiển thị:

- ảnh nhỏ (nếu có)
- tên sản phẩm
- số lượng x đơn giá
- thành tiền

### Bước 3 — Gắn vào `MessageRenderer`

Thay placeholder `order_detail` bằng:

```tsx
case "order_detail":
  return (
    <>
      <TextBubble content={message.content} role={message.role} />
      <OrderDetailPanel
        order={message.data?.order_detail}
        onReorder={handleReorderFromChat}
      />
    </>
  );
```

### Bước 4 — Tạo UI gọn trong khung chat

Yêu cầu UI:

- card trắng, border nhẹ
- section tách rõ `Thông tin giao hàng`, `Sản phẩm`, `Tổng cộng`
- danh sách item có divider mảnh
- cho phép scroll nội bộ nếu item nhiều

### Bước 5 — CTA ở cuối panel

Tối thiểu có 2 CTA:

- `Mua lại`
- `Xem trên trang đơn hàng`

`Xem trên trang đơn hàng` có thể dẫn đến `/account/orders/${order.id}` nếu route tồn tại.

---

## Definition of Done (DoD)

- [ ] Khi bot trả `response_type = order_detail`, chat hiển thị đầy đủ chi tiết đơn.
- [ ] Danh sách item đọc được trên mobile/chat width nhỏ.
- [ ] CTA `Mua lại` có hook để implement ở task tiếp theo.
- [ ] Không yêu cầu reload trang để xem detail.

---

## Ghi chú

- Ưu tiên reuse style từ trang account orders/detail nếu đã có, nhưng nén layout cho chat.
- Nếu `order` là `undefined`, hiển thị fallback text ngắn thay vì crash component.
