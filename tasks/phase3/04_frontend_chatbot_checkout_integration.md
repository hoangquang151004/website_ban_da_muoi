# Task 04 — Frontend: Tích hợp `CheckoutPanel` vào Chatbot renderer

**Giai đoạn:** 3 - Checkout trong chat  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 1.5-2 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`  
**Phụ thuộc:** Task 02, Task 03

---

## Bối cảnh

Sau khi có payload checkout từ backend và component panel, cần nối vào message renderer để người dùng thật sự có thể thao tác đặt hàng ngay trong chat.

---

## Công việc cần làm

### Bước 1 — Map `response_type=checkout_form`

Trong renderer switch/case:

```tsx
case "checkout_form":
  return (
    <>
      <TextBubble content={message.content} role={message.role} />
      <CheckoutPanel ... />
    </>
  );
```

### Bước 2 — Đồng bộ dữ liệu cart

- Ưu tiên dữ liệu `message.data.cart_items` từ backend.
- Nếu payload thiếu, fallback dùng cart store local để tránh panel rỗng.

### Bước 3 — Kết nối quick actions

Các quick action như `Mua ngay`, `Thanh toán` cần:

- gửi message đúng intent checkout,
- trigger bot trả `checkout_form`,
- tự scroll xuống panel khi panel xuất hiện.

### Bước 4 — Trạng thái khi chưa đăng nhập

Nếu bot trả text yêu cầu login, renderer vẫn hiển thị bình thường và không cố mount `CheckoutPanel`.

---

## Definition of Done (DoD)

- [ ] `checkout_form` được render thành panel thực tế trong chat.
- [ ] Quick action checkout hoạt động end-to-end.
- [ ] Không vỡ các response type hiện có.
- [ ] Scroll/chat UX mượt khi panel xuất hiện.

---

## Ghi chú

- Giữ message rendering có tính mở rộng, tránh hardcode logic quá sâu trong một component lớn.
