# Task 01 — Backend: Bổ sung unit/regression tests cho chatbot flows

**Giai đoạn:** 6 - Hardening và QA  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2–3 giờ  
**File chính:** `backend/tests/test_ai_agent.py`

---

## Bối cảnh

Sau 5 giai đoạn trước, `agent.py` sẽ có nhiều nhánh hơn:

- `ORDER`
- `RECOMMEND`
- `KNOWLEDGE`
- `ORDER_QUERY`
- `STATS`

Hardening phase cần khóa các hành vi nền tảng bằng test để tránh regression khi chỉnh prompt, keyword hoặc schema response.

---

## Công việc cần làm

### Bước 1 — Hoàn thiện test intent detection

Đảm bảo `TestIntentDetection` có case cho đủ 5 intent:

- recommend
- knowledge
- order
- order_query
- stats

### Bước 2 — Test contract `response_type`

Thêm test cho `run_chat()` bằng mock để xác nhận từng nhánh trả đúng `response_type`:

- `recommend -> product_cards`
- `knowledge -> text`
- `order -> checkout_form` hoặc `text` khi lỗi
- `order_query -> order_list | order_detail`
- `stats -> stats`

### Bước 3 — Test fallback an toàn

Cần có test cho các trường hợp:

- message mơ hồ → fallback `knowledge`
- user chưa đăng nhập nhưng hỏi order/order_query → yêu cầu đăng nhập
- non-admin hỏi stats → bị từ chối

### Bước 4 — Test response shape tối thiểu

Với từng branch, assert những key quan trọng luôn có mặt:

- `answer`
- `response_type`
- `intent`

Nếu có payload phụ, assert type cơ bản đúng (`list`, `dict`, `None`).

---

## Definition of Done (DoD)

- [ ] Test unit bao phủ đủ 5 intent.
- [ ] Có test contract `response_type` cho mọi nhánh chính.
- [ ] Có test auth/role guard cho `order_query` và `stats`.
- [ ] `pytest tests/test_ai_agent.py -v` pass ở nhóm unit tests.

---

## Ghi chú

- Ưu tiên mock để test nhanh, không phụ thuộc LLM thật.
- Đây là lớp test quan trọng nhất để giữ ổn định unified chat router.
