# Task 06 — Frontend: Phân trang và bộ lọc trạng thái đơn hàng trong chat

**Giai đoạn:** 4 - Quản lý đơn hàng  
**Ưu tiên:** 🟡 P2  
**Ước lượng:** 1–2 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`

---

## Bối cảnh

Task gốc của Giai đoạn 4 có yêu cầu:

- phân trang danh sách đơn hàng
- bộ lọc trạng thái

Vì chatbot có không gian hẹp, không nên bê nguyên pagination full-page vào chat. Cần một bản rút gọn.

---

## Công việc cần làm

### Bước 1 — Bổ sung quick filter trong `OrderListPanel`

Hiển thị 4 filter gọn nhất:

- `Tất cả`
- `Chờ xác nhận`
- `Đang giao`
- `Đã giao`

Cách triển khai đơn giản cho phase này:

- click filter → gửi chat message mới như `Xem đơn hàng của tôi trạng thái đang giao`
- backend phase 4.1 hoặc phase sau có thể parse thêm `status` từ message

### Bước 2 — Nút phân trang đơn giản

Nếu backend trả thêm `page`, `total_pages`, có thể hiển thị:

- `Trang trước`
- `Trang sau`

Ở phase 4 tối giản, dùng message-driven command:

- `Xem đơn hàng của tôi trang 2`

### Bước 3 — Nếu backend chưa parse status/page, để task này ở mức UI stub

Có thể làm trước phần UI controls và TODO rõ ràng:

- `// TODO: parse status/page trong ORDER_QUERY backend`

Mục tiêu là chừa sẵn điểm móc, không cản tiến độ phần list/detail chính.

---

## Definition of Done (DoD)

- [ ] Panel list có chỗ cho filter trạng thái.
- [ ] Có phương án page forward/backward phù hợp với giao diện chat.
- [ ] Nếu chưa nối backend đầy đủ, phải có TODO và fallback rõ ràng.
- [ ] Không làm panel trở nên quá chật hoặc khó bấm trên mobile.

---

## Ghi chú

- Đây là task thấp ưu tiên hơn list/detail cơ bản.
- Nếu cần giảm scope, có thể lùi phần parse `status/page` sang hardening, nhưng UI hook nên chuẩn bị từ phase 4.
