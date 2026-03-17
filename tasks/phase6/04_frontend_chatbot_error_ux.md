# Task 04 — Frontend: Tối ưu UX lỗi và trạng thái chờ trong Chatbot

**Giai đoạn:** 6 - Hardening và QA  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 2 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`

---

## Bối cảnh

Khi chatbot dùng API thật, trải nghiệm lỗi và trạng thái loading quyết định cảm giác “ổn định” của sản phẩm.  
Phase 6 cần chốt UX cho các lỗi phổ biến, không chỉ happy path.

---

## Công việc cần làm

### Bước 1 — Chuẩn hóa nhóm lỗi hiển thị

Tối thiểu phân 5 loại:

- network error
- timeout/provider error
- unauthorized/login required
- forbidden/admin only
- business error (hết hàng, đơn không tồn tại, không đủ quyền xem đơn)

### Bước 2 — Mapping lỗi thành thông điệp thân thiện

Ví dụ:

- network error → `Không thể kết nối máy chủ. Vui lòng thử lại sau.`
- login required → `Vui lòng đăng nhập để tiếp tục thao tác này.`
- out of stock → `Sản phẩm hiện không đủ tồn kho để hoàn tất yêu cầu.`
- admin only → `Chức năng này chỉ dành cho quản trị viên.`

### Bước 3 — Retry UX

Với lỗi tạm thời (network/timeout), nên có một trong hai:

- nút `Thử lại`
- hoặc quick action gửi lại message cũ

### Bước 4 — Loading state tốt hơn

Ngoài typing indicator, cân nhắc:

- disable input khi submit
- disable quick actions khi đang chờ
- loading state riêng cho panel nặng như `stats` hoặc `order_detail`

### Bước 5 — Empty states

Hoàn thiện trạng thái rỗng cho:

- không có sản phẩm phù hợp
- không có đơn hàng
- không có dữ liệu thống kê trong khoảng thời gian chọn

---

## Definition of Done (DoD)

- [ ] Mỗi nhóm lỗi chính có message thân thiện, nhất quán.
- [ ] Có retry path cho lỗi tạm thời.
- [ ] Loading state không cho spam request lặp.
- [ ] Empty state của product/order/stats đọc được và không thô.

---

## Ghi chú

- Không đổ toàn bộ lỗi raw từ backend thẳng ra UI.
- Nếu backend trả `detail`, nên map qua dictionary hoặc heuristic thay vì hiển thị nguyên xi.
