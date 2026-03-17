# Task 05 — Frontend: Hành động trong panel đơn hàng (`Xem chi tiết`, `Mua lại`)

**Giai đoạn:** 4 - Quản lý đơn hàng  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 1–2 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`  
**Tham chiếu:** `frontend/src/app/(shop)/account/orders/page.tsx`, `frontend/src/store/cartStore.ts`

---

## Bối cảnh

Panel list/detail chỉ có giá trị khi user thao tác được ngay trong chat.  
Task này nối các CTA chính để luồng đơn hàng usable.

---

## Công việc cần làm

### Bước 1 — `Xem chi tiết`

Ở `OrderListPanel`, nút `Xem chi tiết` nên gửi lại message mới vào chat:

```ts
handleSend(`Chi tiết đơn #${orderId}`);
```

Lợi ích:

- thống nhất dữ liệu đi qua backend chat
- history hội thoại đầy đủ
- không cần tạo state song song giữa API trực tiếp và chat API

### Bước 2 — `Mua lại`

Tạo `handleReorderFromChat(order)`:

- duyệt `order.items`
- gọi `useCartStore().addItem(...)` cho từng item
- dùng `getAbsoluteImageUrl()` nếu image URL là tương đối
- sau khi add xong, có thể:
  - điều hướng `/cart`, hoặc
  - gửi thêm bot message: "Đã thêm lại sản phẩm vào giỏ hàng"

### Bước 3 — Thông báo thành công/lỗi

Dùng `react-hot-toast` hoặc bubble message để báo:

- `Đã thêm 3 sản phẩm vào giỏ hàng`
- `Không thể mua lại vì đơn hàng không có sản phẩm hợp lệ`

### Bước 4 — Link sang trang đơn hàng đầy đủ

Từ `OrderDetailPanel`, giữ 1 CTA phụ:

- `Xem trên trang đơn hàng`

Nếu route chi tiết chưa có, fallback về `/account/orders`.

---

## Definition of Done (DoD)

- [ ] Click `Xem chi tiết` trong chat tạo được bot response `order_detail`.
- [ ] Click `Mua lại` thêm được item vào cart store.
- [ ] Có feedback rõ ràng sau khi thao tác.
- [ ] Không làm vỡ hydration do store persisted.

---

## Ghi chú

- Với Zustand persist, nên dùng mounted guard trước khi render phần phụ thuộc cart/auth store nếu cần.
- `Mua lại` trong chat nên reuse chính logic từ page account orders nếu có thể, tránh copy business logic lần thứ hai.
