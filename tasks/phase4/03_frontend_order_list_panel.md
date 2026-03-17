# Task 03 — Frontend: Render `order_list` panel trong Chatbot

**Giai đoạn:** 4 - Quản lý đơn hàng  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2–3 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`  
**Tham chiếu:** `frontend/src/app/(shop)/account/orders/page.tsx`

---

## Bối cảnh

Frontend đã có page `account/orders` với UI khá hoàn chỉnh cho danh sách đơn hàng.  
Task này không nên viết mới từ đầu, mà cần **rút gọn** giao diện đó để hiển thị trong khung chat.

---

## Công việc cần làm

### Bước 1 — Tạo `OrderListPanel` component

Tạo component nhận props:

```ts
function OrderListPanel({
  orders,
  onOpenOrder,
}: {
  orders?: ChatOrderSummary[];
  onOpenOrder: (orderId: number) => void;
});
```

UI tối thiểu cho mỗi item:

- Mã đơn `#ORD-0001`
- Ngày tạo
- Trạng thái
- Tổng tiền
- Tên sản phẩm đầu tiên hoặc số lượng item
- Nút `Xem chi tiết`

### Bước 2 — Layout gọn cho chat

Khác với page full-size, panel chat cần:

- max-height + scroll nội bộ nếu list dài
- card padding nhỏ hơn
- bỏ progress bar dài để tránh chật
- giữ badge status màu sắc rõ ràng

### Bước 3 — Gắn vào `MessageRenderer`

Thay placeholder `order_list` bằng:

```tsx
case "order_list":
  return (
    <>
      <TextBubble content={message.content} role={message.role} />
      <OrderListPanel
        orders={message.data?.orders}
        onOpenOrder={handleOpenOrder}
      />
    </>
  );
```

### Bước 4 — Tạo `handleOpenOrder(orderId)`

Trong phase 4 có 2 hướng:

- Hướng A: gửi message mới vào chat như `Chi tiết đơn #${orderId}` để backend trả `order_detail`
- Hướng B: gọi thẳng `orderService.getOrderById(orderId)` ở frontend

**Khuyến nghị:** dùng **Hướng A** để giữ một luồng hội thoại thống nhất.

---

## Definition of Done (DoD)

- [ ] Khi bot trả `response_type = order_list`, chat hiển thị panel list thật.
- [ ] Mỗi order có nút `Xem chi tiết` usable.
- [ ] Layout không bị vỡ trên width ~350–400px của chatbot.
- [ ] Không copy nguyên UI của `account/orders`; chỉ reuse pattern cần thiết.

---

## Ghi chú

- Có thể reuse helper `formatDate()` và `formatCurrency()` từ page orders.
- Nếu `orders` rỗng, render trạng thái trống dạng nhẹ: "Bạn chưa có đơn hàng nào".
- Trạng thái nên map label thân thiện: `pending -> Chờ xác nhận`, `shipping -> Đang giao`, ...
