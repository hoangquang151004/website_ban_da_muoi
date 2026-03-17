# Task 07 — Verification: Unit tối thiểu và checklist manual cho Phase 3

**Giai đoạn:** 3 - Checkout trong chat  
**Ưu tiên:** 🟡 P1  
**Ước lượng:** 1-2 giờ  
**File chính:** tests backend/frontend tương ứng  
**Phụ thuộc:** Task 05, Task 06

---

## Bối cảnh

Phase 3 đụng vào flow nhạy cảm (checkout, tạo đơn, xóa giỏ), cần có kiểm tra tối thiểu để giảm regression khi merge.

---

## Công việc cần làm

### Bước 1 — Unit test tối thiểu cho service mapping

Frontend:

- test `orderService.createOrder()` unwrap đúng `BaseResponse.data`.

Backend (nếu có test cho agent):

- test nhánh chat checkout trả `response_type=checkout_form` khi hợp lệ.

### Bước 2 — Checklist manual E2E

Chuẩn bị checklist chạy tay:

1. User đã login, cart có hàng -> chat yêu cầu thanh toán -> thấy `CheckoutPanel`.
2. Submit hợp lệ -> tạo đơn thành công, thấy mã đơn, cart clear.
3. Lỗi stock -> thông báo đúng, cart không clear.
4. User chưa login -> bot yêu cầu đăng nhập, không render panel checkout.
5. Network lỗi -> có thông báo và cho retry.

### Bước 3 — Regression checks

- Trang checkout chuẩn vẫn hoạt động.
- Các response type khác trong chatbot không bị ảnh hưởng.

---

## Definition of Done (DoD)

- [ ] Có test hoặc tối thiểu test case rõ ràng cho contract quan trọng.
- [ ] Checklist manual phase3 được chạy qua đầy đủ.
- [ ] Ghi nhận kết quả pass/fail cho từng case trước khi đóng phase.

---

## Ghi chú

- Nếu chưa có hạ tầng test frontend đầy đủ, vẫn cần lưu checklist manual như artifact bắt buộc.
- Ưu tiên test các điểm có rủi ro nghiệp vụ: tạo đơn và clear cart.

---

## Kết quả chạy thực tế (2026-03-13)

### 1) Unit/automated checks

- [x] Backend test nhánh checkout contract:
  - Lệnh: `pytest tests/test_ai_agent.py -q -k "CheckoutChatContract or test_ordering_no_auth"`
  - Kết quả: `5 passed, 42 deselected`
  - Bao phủ: checkout_form payload shape, login required, empty cart fallback, invalid cart data fallback, ordering no-auth.

- [x] Chạy full `test_ai_agent.py` để kiểm tra regression rộng:
  - Lệnh: `pytest tests/test_ai_agent.py -q`
  - Kết quả: `43 passed, 4 failed`
  - Nguyên nhân fail: `APIStatusError 402` từ provider LLM (hết quota credits) ở nhóm `TestTextToSQL`, không phải do thay đổi phase3 checkout.

- [x] Frontend regression type-check:
  - Lệnh: `npx tsc --noEmit`
  - Kết quả: `TS_OK`

- [x] Contract `orderService.createOrder()` unwrap:
  - Trạng thái: Đã xác nhận trong code
  - Vị trí: `frontend/src/services/orderService.ts`
  - Kỳ vọng: `return data.data` từ `BackendResponse<CreateOrderResponse>`
  - Kết luận: Đạt

### 2) Checklist manual E2E Phase 3

1. User đã login, cart có hàng -> chat yêu cầu thanh toán -> thấy `CheckoutPanel`.
   - Trạng thái: ⚠️ Chưa chạy tay trực tiếp trong phiên này (cần UI tương tác).

2. Submit hợp lệ -> tạo đơn thành công, thấy mã đơn, cart clear.
   - Trạng thái: ⚠️ Chưa chạy tay trực tiếp trong phiên này (cần UI tương tác).

3. Lỗi stock -> thông báo đúng, cart không clear.
   - Trạng thái: ⚠️ Chưa chạy tay trực tiếp trong phiên này (cần dữ liệu stock edge-case và UI tương tác).

4. User chưa login -> bot yêu cầu đăng nhập, không render panel checkout.
   - Trạng thái: ✅ Đã verify bằng backend test `test_checkout_requires_login`.

5. Network lỗi -> có thông báo và cho retry.
   - Trạng thái: ✅ Đã verify ở mức logic frontend (map lỗi + retry payload trong Chatbot), ⚠️ chưa chạy tay UI click-flow.

### 3) Regression checks

- [x] Các response type khác trong chatbot không bị lỗi type-check sau khi tích hợp checkout.
- [x] Backend checkout chat contract vẫn pass.
- [ ] Trang checkout chuẩn (`/checkout`) chạy tay end-to-end trong phiên này.
  - Ghi chú: Chưa xác nhận bằng thao tác UI trực tiếp.

### 4) Kết luận

- [x] Có test/tối thiểu test case rõ ràng cho contract quan trọng.
- [ ] Checklist manual phase3 chạy tay đầy đủ 100% trong phiên này.
- [x] Có ghi nhận pass/fail/blocked rõ ràng cho từng case.

Nguyên nhân phần manual còn thiếu: môi trường hiện tại chưa có luồng UI tương tác được xác nhận ổn định trong phiên (Next dev lock bởi instance khác), nên chưa thể hoàn tất các bước click-flow trực quan ngay tại đây.
