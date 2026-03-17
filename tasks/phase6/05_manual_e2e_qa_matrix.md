# Task 05 — QA: Ma trận kiểm thử end-to-end cho chatbot commerce assistant

**Giai đoạn:** 6 - Hardening và QA  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 2–3 giờ  
**File chính:** tài liệu checklist QA, chạy tay trên local/staging

---

## Bối cảnh

Dự án hiện chưa có test E2E frontend chuyên dụng như Playwright/Cypress.  
Vì vậy Phase 6 cần một ma trận kiểm thử tay rõ ràng để xác nhận toàn bộ flow chatbot trước khi release.

---

## Công việc cần làm

### Nhóm 1 — Tư vấn sản phẩm

- [ ] Gõ: `Gợi ý đèn cho người mất ngủ dưới 500k`
  - Kỳ vọng: bot trả `product_cards`, có ít nhất 1 card, giá hợp lệ.
- [ ] Gõ: `Đèn cho phòng khách`
  - Kỳ vọng: bot trả sản phẩm liên quan, không crash.
- [ ] Click `Xem chi tiết`
  - Kỳ vọng: điều hướng đúng trang sản phẩm.
- [ ] Click `Thêm vào giỏ`
  - Kỳ vọng: cart tăng số lượng.

### Nhóm 2 — Hỏi đáp CSKH / RAG

- [ ] Gõ: `Phí vận chuyển tính như thế nào?`
- [ ] Gõ: `Bảo hành bao lâu?`
- [ ] Gõ: `Có đổi trả được không?`
  - Kỳ vọng: câu trả lời có liên quan policy docs, có sources nếu thiết kế có.

### Nhóm 3 — Checkout trong chat

- [ ] Từ product card → `Mua ngay`
  - Kỳ vọng: checkout panel mở trong chat.
- [ ] Điền form hợp lệ và submit
  - Kỳ vọng: tạo đơn thành công, hiện mã đơn/tóm tắt.
- [ ] Submit khi thiếu thông tin
  - Kỳ vọng: validation rõ ràng.
- [ ] Submit khi stock không đủ
  - Kỳ vọng: báo lỗi thân thiện, không treo UI.

### Nhóm 4 — Quản lý đơn hàng

- [ ] User chưa đăng nhập hỏi `đơn hàng của tôi`
  - Kỳ vọng: yêu cầu đăng nhập.
- [ ] User đã đăng nhập hỏi `xem đơn hàng của tôi`
  - Kỳ vọng: hiện `order_list`.
- [ ] Click `Xem chi tiết`
  - Kỳ vọng: hiện `order_detail` trong chat.
- [ ] Click `Mua lại`
  - Kỳ vọng: item được thêm lại vào cart.

### Nhóm 5 — Thống kê admin

- [ ] User thường hỏi `doanh thu tháng này`
  - Kỳ vọng: bị từ chối.
- [ ] Admin hỏi `doanh thu tháng này`
  - Kỳ vọng: hiện widget stats.
- [ ] Admin hỏi `Top 5 sản phẩm bán chạy quý này là gì?`
  - Kỳ vọng: trả được widget/table usable.

### Nhóm 6 — Robustness

- [ ] Refresh trang khi chat đang mở
  - Kỳ vọng: không crash hydration.
- [ ] Tắt backend rồi gửi message
  - Kỳ vọng: hiện network error thân thiện.
- [ ] Gửi nhiều request liên tiếp khi loading
  - Kỳ vọng: request bị chặn hoặc UI disable đúng.

---

## Definition of Done (DoD)

- [ ] Toàn bộ 6 nhóm test được chạy ít nhất 1 vòng.
- [ ] Mỗi lỗi phát hiện được ghi lại theo format: bước tái hiện, kỳ vọng, thực tế.
- [ ] Các blocker P0/P1 được xử lý trước release.

---

## Ghi chú

- Nếu team có thời gian sau phase 6, nên chuyển ma trận này thành Playwright smoke tests.
- Nhưng ở hiện trạng repo, checklist tay là đủ thực dụng để chốt release đầu tiên.
