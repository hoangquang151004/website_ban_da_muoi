# Task 02 — Backend: Integration tests cho edge cases quan trọng

**Giai đoạn:** 6 - Hardening và QA  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2–4 giờ  
**File chính:** `backend/tests/test_ai_agent.py` hoặc tách file mới `backend/tests/test_chatbot_edge_cases.py`

---

## Bối cảnh

Kế hoạch gốc của Giai đoạn 6 nhấn mạnh 4 edge case:

- tồn kho thay đổi
- tài liệu CSKH mâu thuẫn
- đơn fail
- timeout

Các case này mới là phần dễ vỡ nhất khi chatbot bắt đầu chạm business logic thật.

---

## Công việc cần làm

### Bước 1 — Edge case: tồn kho thay đổi khi checkout

Test mong muốn:

- sản phẩm còn 1 cái
- payload đặt 2 cái
- backend trả lỗi 400 hợp lệ
- chatbot/frontend sau này có thể hiển thị message thân thiện

Có thể test trực tiếp `order_crud.create_order()` hoặc route `/orders`.

### Bước 2 — Edge case: product đã hết hàng nhưng recommendation/order vẫn nhắc đến

Mock hoặc seed dữ liệu sao cho:

- recommendation trả item cũ
- đến lúc đặt thì stock = 0

Mục tiêu: nhánh order phải fail an toàn, không tạo đơn dở dang.

### Bước 3 — Edge case: RAG gặp tài liệu chính sách mâu thuẫn

Tạo 2 documents policy có nội dung mâu thuẫn nhẹ trong môi trường test/mock.  
Kỳ vọng:

- chain không bịa thêm ngoài context
- answer có dấu hiệu thận trọng kiểu “theo thông tin hiện có…” hoặc cần xác nhận lại

Nếu chưa thể kiểm soát chain đủ chặt, ít nhất ghi nhận đây là test cảnh báo/known limitation.

### Bước 4 — Edge case: timeout hoặc lỗi provider LLM

Mock `get_llm()` hoặc `.ainvoke()` ném exception/timeout:

- unified chat không crash
- trả lỗi có kiểm soát ở router/service layer

### Bước 5 — Edge case: SQL độc hại cho admin report

Đã có test SQL validation, nhưng cần thêm 1 case flow hoàn chỉnh qua `run_admin_report()` hoặc admin route để chắc chắn thông điệp lỗi không rò dữ liệu.

---

## Definition of Done (DoD)

- [ ] Có test hết hàng / không đủ stock.
- [ ] Có test lỗi order fail không tạo transaction dở dang.
- [ ] Có test timeout hoặc exception từ LLM/provider.
- [ ] Có test policy conflict hoặc ít nhất documented limitation.
- [ ] Có test an toàn cho admin text-to-sql path.

---

## Ghi chú

- Không cần ép mọi case thành integration với dịch vụ ngoài thật; mock hợp lý là chấp nhận được.
- Trường hợp policy conflict khó deterministic, có thể biến thành test bán thủ công + checklist nếu cần.
