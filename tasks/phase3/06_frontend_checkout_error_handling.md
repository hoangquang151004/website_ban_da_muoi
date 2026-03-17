# Task 06 — Frontend: Hardening UX lỗi cho checkout trong chat

**Giai đoạn:** 3 - Checkout trong chat  
**Ưu tiên:** 🟡 P1  
**Ước lượng:** 1-1.5 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`, `frontend/src/components/shop/CheckoutPanel.tsx`  
**Phụ thuộc:** Task 05

---

## Bối cảnh

Luồng checkout trong chat dễ gặp lỗi thực tế: hết hàng, phiên đăng nhập hết hạn, mạng chập chờn, user click submit nhiều lần.  
Task này tập trung hardening để UX an toàn và đáng tin cậy.

---

## Công việc cần làm

### Bước 1 — Chống submit lặp

- Dùng cờ `isSubmitting` chặn double click.
- Nếu đang submit thì bỏ qua request mới.

### Bước 2 — Mapping lỗi theo nhóm

Map lỗi thành thông điệp dễ hiểu:

- `401/403`: yêu cầu đăng nhập lại.
- `409/422` liên quan stock: báo sản phẩm không đủ tồn.
- Network timeout: gợi ý thử lại.
- Unknown: lỗi chung thân thiện.

### Bước 3 — Empty state và fallback

- Nếu panel không có item hợp lệ: hiển thị trạng thái rỗng + CTA quay lại mua hàng.
- Nếu payload backend thiếu trường: fallback hợp lý thay vì crash.

### Bước 4 — Nút thử lại

Với lỗi tạm thời (network/5xx), hiển thị action `Thử lại` để gửi lại submit nhanh.

---

## Definition of Done (DoD)

- [ ] Không thể tạo nhiều đơn do click liên tục.
- [ ] Lỗi auth/stock/network hiển thị thông điệp đúng ngữ cảnh.
- [ ] Không có crash UI khi payload thiếu hoặc cart rỗng.
- [ ] Có ít nhất một luồng retry thân thiện.

---

## Ghi chú

- Tránh log lộ thông tin nhạy cảm lên UI.
- Có thể gom mapping lỗi vào helper riêng để dễ tái sử dụng.
