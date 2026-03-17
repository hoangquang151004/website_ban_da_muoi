# Task 05 — Frontend: Submit đơn trong chat và hiển thị kết quả

**Giai đoạn:** 3 - Checkout trong chat  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`, `frontend/src/services/orderService.ts`  
**Phụ thuộc:** Task 04

---

## Bối cảnh

Sau khi render được panel checkout, bước quan trọng là submit tạo đơn ngay trong chat và phản hồi kết quả rõ ràng cho user.

---

## Công việc cần làm

### Bước 1 — Nối submit với `POST /orders`

Từ `CheckoutPanel.onSubmit`:

- map form data + cart items thành `CreateOrderPayload`,
- gọi `orderService.createOrder(payload)`.

### Bước 2 — Trạng thái loading/success/error

- Loading: disable form + nút submit.
- Success: thêm message bot xác nhận thành công.
- Error: thêm message bot báo lỗi thân thiện.

### Bước 3 — Hiển thị thông tin đơn tạo thành công

Sau success, hiển thị tối thiểu:

- mã đơn (`order_code` hoặc `id`),
- tổng tiền,
- phương thức thanh toán,
- lời dẫn tiếp theo (ví dụ: "Bạn có thể theo dõi tại Đơn hàng của tôi").

### Bước 4 — Clear cart đúng thời điểm

- Chỉ clear cart sau khi API tạo đơn thành công thực sự.
- Không clear khi request lỗi/time out.

---

## Definition of Done (DoD)

- [ ] Người dùng tạo đơn thành công ngay trong chatbot.
- [ ] Có trạng thái loading và feedback kết quả rõ ràng.
- [ ] Cart chỉ bị clear khi tạo đơn thành công.
- [ ] Không làm hỏng luồng checkout trang đầy đủ.

---

## Ghi chú

- Ưu tiên append message vào lịch sử chat để giữ ngữ cảnh hội thoại.
- Nếu backend trả thêm metadata đơn hàng, tận dụng để nâng chất lượng thông điệp xác nhận.
