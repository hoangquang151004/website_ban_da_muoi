# Task 07 — Hardening: Logging an toàn và observability tối thiểu

**Giai đoạn:** 6 - Hardening và QA  
**Ưu tiên:** 🟡 P2  
**Ước lượng:** 1–2 giờ  
**File chính:** backend chat/order services, có thể thêm middleware/log helper nếu cần

---

## Bối cảnh

Kế hoạch tổng thể đã yêu cầu logging cho truy vấn chatbot và hành động đặt hàng.  
Phase 6 là thời điểm phù hợp để chốt mức logging tối thiểu phục vụ debug mà không rò dữ liệu nhạy cảm.

---

## Công việc cần làm

### Bước 1 — Xác định dữ liệu cần log

Nên log:

- `session_id`
- `user_id` (nếu có)
- `intent`
- `response_type`
- thời gian xử lý request
- nguồn stats (`rest` / `text_to_sql`)
- kết quả tạo đơn thành công/thất bại

### Bước 2 — Không log dữ liệu nhạy cảm thô

Không log nguyên văn:

- token
- địa chỉ đầy đủ nếu không cần
- số điện thoại đầy đủ
- raw SQL nhạy cảm trong môi trường production nếu policy nội bộ không cho phép

### Bước 3 — Log lỗi có cấu trúc

Ví dụ:

- `chat_request_failed`
- `order_checkout_failed`
- `rag_timeout`
- `stats_admin_forbidden`

### Bước 4 — Quan sát tối thiểu để debug

Với các flow chính, khi có lỗi phải đủ dữ liệu để trả lời:

- user đang ở flow nào?
- intent nào được detect?
- request fail ở backend business logic hay provider LLM?

---

## Definition of Done (DoD)

- [ ] Có logging cơ bản cho chat requests và checkout.
- [ ] Log không lộ secrets / PII quá mức.
- [ ] Có thể truy vết được lỗi của các flow chính qua log.
- [ ] Có guideline rõ ràng chỗ nào nên/không nên log.

---

## Ghi chú

- Không cần dựng full observability stack ở phase này.
- Chỉ cần logging có cấu trúc, đủ giúp debug thực tế sau release đầu.
