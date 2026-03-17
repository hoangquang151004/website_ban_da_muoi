# Task 03 — Frontend: Tách `CheckoutPanel` component cho chat

**Giai đoạn:** 3 - Checkout trong chat  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2-3 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx` (tách ra component con)  
**Tham chiếu:** `frontend/src/app/(shop)/cart_checkout/*`  
**Phụ thuộc:** Task 01, có thể làm song song Task 02 sau khi chốt type

---

## Bối cảnh

UI checkout ở trang đầy đủ đã có logic form và tổng tiền, nhưng trong chat cần phiên bản gọn.  
Task này tạo `CheckoutPanel` tái sử dụng logic cốt lõi thay vì viết mới toàn bộ.

---

## Công việc cần làm

### Bước 1 — Tạo component `CheckoutPanel`

Props đề xuất:

```ts
type CheckoutPanelProps = {
  cartItems: ChatCheckoutItem[];
  isSubmitting?: boolean;
  onSubmit: (payload: CheckoutSubmitPayload) => Promise<void>;
};
```

### Bước 2 — Render các phần tối thiểu

- Danh sách sản phẩm (ảnh, tên, số lượng, giá).
- Form nhận hàng: người nhận, số điện thoại, địa chỉ.
- Phương thức thanh toán.
- Tổng tiền + phí (nếu có) + thành tiền.
- Nút xác nhận đặt hàng.

### Bước 3 — Validation cơ bản

Tối thiểu kiểm tra:

- Không bỏ trống tên/số điện thoại/địa chỉ.
- Số điện thoại đúng pattern cơ bản.
- Có ít nhất 1 item hợp lệ.

### Bước 4 — Layout tối ưu cho chatbot

- Chiều rộng phù hợp panel chat (~350-420px).
- Nội dung dài có scroll nội bộ.
- Nút submit luôn dễ thấy (sticky nhẹ hoặc nằm cuối card rõ ràng).

---

## Definition of Done (DoD)

- [ ] Có component `CheckoutPanel` tách riêng, không nhồi hết vào `Chatbot.tsx`.
- [ ] Render đúng dữ liệu `cart_items` từ message data.
- [ ] Validation hoạt động, không submit khi dữ liệu thiếu.
- [ ] UI dùng được trên mobile và desktop.

---

## Ghi chú

- Reuse helper format tiền/ngày sẵn có trong codebase.
- Không cần replicate toàn bộ UX của trang checkout đầy đủ, chỉ giữ phần thiết yếu.
