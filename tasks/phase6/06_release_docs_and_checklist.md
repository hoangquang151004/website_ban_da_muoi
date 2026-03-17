# Task 06 — Release: Tài liệu vận hành và checklist chốt release

**Giai đoạn:** 6 - Hardening và QA  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 1–2 giờ  
**File chính:** `how_to_run.md` và checklist release nội bộ

---

## Bối cảnh

Khi chatbot bắt đầu phụ thuộc đồng thời vào:

- backend API
- vector store ChromaDB
- LLM provider
- auth state frontend

thì tài liệu chạy hệ thống và checklist release trở nên bắt buộc. Nếu không, môi trường chạy thử sẽ rất dễ lệch và gây bug giả.

---

## Công việc cần làm

### Bước 1 — Cập nhật `how_to_run.md`

Bổ sung tối thiểu:

- cách chạy backend/frontend
- yêu cầu `.env`
- seed vector store
- provider LLM đang dùng
- tài khoản test user/admin nếu có

Ví dụ nội dung cần có:

```md
1. Kích hoạt môi trường Python
2. Chạy backend: uvicorn app.main:app --reload --port 8000
3. Seed ChromaDB: python scripts/seed_vector_store.py
4. Chạy frontend: npm run dev
5. Kiểm tra chatbot tại trang shop
```

### Bước 2 — Checklist pre-release

Tạo checklist nội bộ gồm:

- [ ] backend chạy
- [ ] frontend chạy
- [ ] ChromaDB đã seed latest policy docs
- [ ] LLM token hợp lệ
- [ ] `pytest` unit pass
- [ ] `npm run lint` / `npm run typecheck` không phát sinh lỗi mới ở phần chatbot
- [ ] manual QA matrix đã chạy

### Bước 3 — Checklist production safety

Trước khi deploy thật:

- [ ] không còn hard-coded API key trong source
- [ ] `.env.example` đã cập nhật đủ biến
- [ ] quyền admin được kiểm tra lại với stats flow
- [ ] dữ liệu chính sách RAG là bản mới nhất

### Bước 4 — Known issues / technical debt

Ghi rõ những gì **chưa hoàn hảo nhưng chấp nhận được** cho release đầu:

- lỗi lint/typecheck cũ ngoài phạm vi chatbot
- chưa có Playwright/Cypress
- policy conflict trong RAG chưa hoàn toàn deterministic

---

## Definition of Done (DoD)

- [ ] `how_to_run.md` đủ để một dev khác chạy chatbot end-to-end.
- [ ] Có checklist pre-release rõ ràng.
- [ ] Có danh sách known issues còn tồn tại.
- [ ] Không còn phụ thuộc vào “kiến thức ngầm” của người triển khai.

---

## Ghi chú

- Đây là task ít hào nhoáng nhưng giá trị rất cao: giúp demo, handoff và deploy ổn định.
- Nếu cần, có thể đổi task này thành cập nhật `README` trung tâm thay vì chỉ `how_to_run.md`.
