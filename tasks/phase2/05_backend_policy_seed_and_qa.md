# Task 05 — Backend: Bổ sung dữ liệu chính sách vào ChromaDB và kiểm thử QA

**Giai đoạn:** 2 - Tư vấn sản phẩm & CSKH  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 2 giờ  
**File chính:** `backend/scripts/seed_vector_store.py`, `backend/tests/test_ai_agent.py`

---

## Bối cảnh

RAG chain đã có, nhưng để chatbot trả lời tốt các câu hỏi CSKH như:

- phí vận chuyển
- đổi trả
- bảo hành
- hướng dẫn sử dụng

thì ChromaDB phải có tài liệu tương ứng.  
Hiện `seed_vector_store.py` đang seed nhiều kiến thức về công dụng/phong thủy, nhưng chưa thấy bộ policy docs rõ ràng theo các chủ đề CSKH này.

---

## Công việc cần làm

### Bước 1 — Thêm `POLICY_DOCS` vào `seed_vector_store.py`

Ngay dưới `KNOWLEDGE_DOCS`, thêm một list `POLICY_DOCS` gồm các `Document` có metadata rõ ràng:

```python
POLICY_DOCS: list[Document] = [
    Document(
        page_content=(
            "Chính sách vận chuyển: Miễn phí ship nội thành cho đơn từ 1.000.000đ. "
            "Các đơn dưới mức này tính phí theo khu vực. Thời gian giao hàng 2-5 ngày làm việc."
        ),
        metadata={"doc_id": "policy_shipping_001", "category": "policy", "title": "Chính sách vận chuyển"},
    ),
    Document(
        page_content=(
            "Chính sách đổi trả: Hỗ trợ đổi trả trong vòng 7 ngày nếu sản phẩm lỗi do nhà sản xuất hoặc hư hỏng khi vận chuyển. "
            "Sản phẩm phải còn đầy đủ phụ kiện và hình ảnh xác nhận."
        ),
        metadata={"doc_id": "policy_return_001", "category": "policy", "title": "Chính sách đổi trả"},
    ),
    Document(
        page_content=(
            "Chính sách bảo hành: Bảo hành bóng đèn và dây điện 3 tháng. Khối đá muối tự nhiên không áp dụng bảo hành nứt vỡ do va đập hoặc ẩm nước."
        ),
        metadata={"doc_id": "policy_warranty_001", "category": "policy", "title": "Chính sách bảo hành"},
    ),
    Document(
        page_content=(
            "Hướng dẫn sử dụng: Đặt đèn ở nơi khô ráo, tránh nước. Bật đèn 1-3 giờ mỗi ngày. Lau bằng khăn khô, không dùng khăn ướt."
        ),
        metadata={"doc_id": "policy_usage_001", "category": "policy", "title": "Hướng dẫn sử dụng"},
    ),
]
```

### Bước 2 — Seed thêm `POLICY_DOCS` trong `main()`

Cập nhật phần main:

```python
print(f"[1/4] Nạp {len(KNOWLEDGE_DOCS)} documents kiến thức...")
upsert_documents(KNOWLEDGE_DOCS)

print(f"[2/4] Nạp {len(POLICY_DOCS)} documents chính sách...")
upsert_documents(POLICY_DOCS)
```

và đẩy các bước tiếp theo thành `[3/4]`, `[4/4]`.

### Bước 3 — Bổ sung test integration cho policy QA

Trong `backend/tests/test_ai_agent.py`, thêm 3 test:

```python
async def test_rag_shipping_policy(self):
    chain = create_rag_chain_with_sources()
    result = await chain.ainvoke({"question": "Phí vận chuyển được tính như thế nào?"})
    assert "answer" in result
    assert len(result["sources"]) > 0

async def test_rag_return_policy(self):
    chain = create_rag_chain_with_sources()
    result = await chain.ainvoke({"question": "Sản phẩm lỗi có được đổi trả không?"})
    assert "answer" in result

async def test_rag_warranty_policy(self):
    chain = create_rag_chain_with_sources()
    result = await chain.ainvoke({"question": "Đèn đá muối được bảo hành bao lâu?"})
    assert "answer" in result
```

### Bước 4 — Chạy seed lại

Chạy lại:

```bash
cd backend
python scripts/seed_vector_store.py
```

---

## Definition of Done (DoD)

- [ ] ChromaDB có thêm documents category `policy`.
- [ ] Hỏi về ship / đổi trả / bảo hành → RAG trả lời có liên quan.
- [ ] `sources` trả về chứa title tương ứng với policy docs.
- [ ] Test integration mới pass khi DB và vector store đã seed.

---

## Ghi chú

- Nội dung policy trong ví dụ chỉ là mẫu. Khi làm thật cần thay bằng chính sách kinh doanh thực tế của cửa hàng.
- Nếu cửa hàng có file PDF/Word chính sách chính thức, nên parse file và index thay vì hardcode string.
- Task này giúp deliverable “Trả lời đúng phí ship/bảo hành” có cơ sở dữ liệu thật thay vì prompt đoán.
