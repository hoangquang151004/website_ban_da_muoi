## Plan: Phase 3 Checkout In Chat Tasks

Tách Giai đoạn 3 thành các task nhỏ theo đúng trạng thái code hiện tại: ưu tiên sửa contract checkout/service trước, sau đó mới render panel và hoàn thiện luồng submit + trạng thái kết quả trong chat.

**Steps**

1. Tạo task backend chuẩn hóa payload checkout cho chat: xác định khi nào trả `response_type=checkout_form`, schema tối thiểu của `cart_item` và guard đăng nhập.
2. Tạo task frontend sửa `orderService.createOrder()` để unwrap đúng `BaseResponse.data` (điểm rủi ro hiện tại) và bổ sung type cho payload/response checkout (_depends on 1_).
3. Tạo task tách `CheckoutPanel` component dùng lại logic từ trang checkout hiện có (form nhận hàng, payment method, tổng tiền, validation) nhưng layout gọn cho chat (_parallel with 2 after contract ổn định_).
4. Tạo task tích hợp `CheckoutPanel` vào `Chatbot.tsx` theo `response_type=checkout_form`, đồng bộ với cart store và quick actions (`Mua ngay`, `Thanh toán`) (_depends on 2,3_).
5. Tạo task submit đơn ngay trong chat: gọi `POST /api/v1/orders`, xử lý loading/success/error, trả mã đơn + tóm tắt và clear cart đúng thời điểm (_depends on 4_).
6. Tạo task hardening checkout chat UX: chống submit lặp, mapping lỗi (stock/401/network), empty state, và fallback khi chưa đăng nhập (_depends on 5_).
7. Tạo task kiểm thử giai đoạn 3: unit tối thiểu cho service/chat mapping + checklist manual E2E cho checkout in chat (_depends on 5,6_).

**Relevant files**

- `tasks/phase3/01_backend_checkout_chat_contract.md` — Contract backend cho checkout trong chat (`response_type`, payload, auth behavior).
- `tasks/phase3/02_frontend_order_service_contract_fix.md` — Sửa/chuẩn hóa contract order service và type checkout.
- `tasks/phase3/03_frontend_checkout_panel_component.md` — Thiết kế + tái sử dụng logic checkout thành panel nhúng chat.
- `tasks/phase3/04_frontend_chatbot_checkout_integration.md` — Gắn panel vào `Chatbot.tsx` theo message renderer.
- `tasks/phase3/05_frontend_checkout_submit_and_result.md` — Luồng submit, thành công/thất bại, mã đơn, summary.
- `tasks/phase3/06_frontend_checkout_error_handling.md` — Mapping lỗi, retry, chống double submit.
- `tasks/phase3/07_phase3_verification_checklist.md` — Danh mục test + kịch bản manual QA cho phase 3.

**Verification**

1. Gửi message tạo checkout flow trong chat -> render đúng `checkout_form` panel.
2. Submit hợp lệ -> tạo đơn thành công, hiện mã đơn/tóm tắt, cart được clear.
3. Submit lỗi stock/network/auth -> thông báo đúng, không tạo đơn giả, không crash UI.
4. Kiểm tra regression: luồng checkout trang `/checkout` hiện có không bị ảnh hưởng.

**Decisions**

- Ưu tiên sửa contract `orderService.createOrder` sớm vì có rủi ro unwrap sai `BaseResponse`.
- Không tạo API mới nếu chưa cần; tận dụng `POST /api/v1/orders` và chat unified route hiện có.
- Scope phase 3 chỉ tập trung checkout in chat; order list/detail và stats để phase 4/5.

**Further Considerations**

1. Nếu backend không bổ sung payload `checkout_form` đủ chi tiết, frontend sẽ fallback lấy dữ liệu từ cart store để dựng panel.
2. Nếu cần tốc độ triển khai, có thể làm `03` và `04` song song sau khi `02` chốt contract type.
