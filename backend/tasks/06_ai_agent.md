# Nhóm 6: AI Agent (Lõi Đồ án)

Mục tiêu chung: Triển khai hệ thống AI Agent với 4 use case theo đặc tả trong `PROJECT_CONTEXT.md`. **TOÀN BỘ logic AI phải nằm trong `backend/app/services/ai_agent/`. Tuyệt đối không viết logic AI trong Router.**

---

## Kiến trúc tổng thể

```
app/services/ai_agent/
├── __init__.py
├── llm.py                  # Khởi tạo LLM client (LangChain ChatOpenAI / Gemini...)
├── vector_store.py         # Kết nối ChromaDB, hàm upsert & query embedding
├── tools/
│   ├── __init__.py
│   ├── product_search.py   # Tool: tìm kiếm sản phẩm kết hợp Vector + SQL
│   ├── add_to_cart.py      # Tool: thêm sản phẩm vào giỏ hàng
│   └── text_to_sql.py      # Tool: sinh và thực thi câu SQL từ câu hỏi
├── chains/
│   ├── rag_chain.py        # RAG chain cho tư vấn kiến thức
│   └── admin_report.py     # Chain cho Text-to-SQL báo cáo
└── agent.py                # LangGraph agent orchestration
```

---

## Các Task

### --- Hạ tầng AI ---

- [ ] Khởi tạo LLM Client
  - **Mục tiêu**: Tạo singleton LLM instance dùng chung cho tất cả chain/agent.
  - **Output**: `app/services/ai_agent/llm.py`
    - `get_llm()` → trả về `ChatOpenAI` (hoặc model khác) được config từ `settings.OPENAI_API_KEY`.
    - Có thể dễ dàng đổi provider (OpenAI → Gemini → Ollama) chỉ bằng cách sửa 1 file.
  - **DoD**: Import `get_llm()` ở bất kỳ đâu trong `ai_agent/` đều trả về cùng instance.

- [ ] Thiết lập Vector Store (ChromaDB)
  - **Mục tiêu**: Kết nối ChromaDB local, tạo collection cho kiến thức sản phẩm.
  - **Output**: `app/services/ai_agent/vector_store.py`:
    - `get_vector_store()` → ChromaDB client + collection `salt_lamp_knowledge`
    - `upsert_documents(docs: list[Document])` — thêm/cập nhật documents
    - `similarity_search(query: str, k: int = 5) → list[Document]`
  - **Ghi chú**: Sử dụng `langchain_community.vectorstores.Chroma`. Embedding model có thể dùng `OpenAIEmbeddings` hoặc `HuggingFaceEmbeddings` (free).
  - **DoD**: Index thử 3 đoạn text về công dụng đèn đá muối, query bằng câu hỏi ngữ nghĩa → trả về đoạn liên quan.

- [ ] Script nạp dữ liệu kiến thức vào ChromaDB
  - **Mục tiêu**: Tạo script chạy một lần để seed dữ liệu kiến thức vào Vector Store.
  - **Output**: `backend/scripts/seed_vector_store.py`
  - **Nội dung cần index**:
    - Kiến thức về công dụng sức khỏe của đèn đá muối himalaya
    - Kiến thức phong thủy (màu sắc, vị trí đặt đèn)
    - Mô tả chi tiết các sản phẩm trong DB (tự động lấy từ MySQL và index)
    - **Mô tả từng `Use` từ bảng `uses`** (tự động đọc từng dòng và index với metadata `use_id`, `use_name`) — giúp AI Agent map từ câu chat của user sang `use_id` chính xác.
  - **DoD**: Chạy script → ChromaDB có data. Query `"Đèn đá muối có tác dụng gì?"` trả về context liên quan. Query `"trị mất ngủ"` trả về document có metadata `use_id` đúng.

---

### --- Use Case 1: Chatbot Tư vấn Kiến thức (RAG) ---

- [ ] RAG Chain
  - **Mục tiêu**: Tạo LangChain chain trả lời câu hỏi dựa trên kiến thức đã index, không bịa thông tin.
  - **Output**: `app/services/ai_agent/chains/rag_chain.py`:
    - `create_rag_chain()` → `RunnablePassthrough | retriever | prompt | llm | StrOutputParser`
    - Prompt system message: _"Bạn là trợ lý tư vấn sản phẩm đèn đá muối Himalaya. Chỉ trả lời dựa trên context được cung cấp. Nếu không có thông tin, hãy nói 'Tôi chưa có thông tin về điều này.'"_
  - **DoD**: Hỏi về công dụng đèn → trả lời dựa trên context. Hỏi về chủ đề ngoài → từ chối lịch sự, không bịa.

- [ ] API `POST /api/chat/knowledge` — Endpoint RAG
  - **Request**: `{ "message": "Đèn đá muối có tác dụng gì?", "session_id"? }`
  - **Logic**: Gọi `rag_chain.invoke({"question": message})`.
  - **Response**: `{ "answer": "...", "sources": [{"title": "...", "snippet": "..."}] }`
  - **DoD**: Response trong < 5 giây. Sources trả về đúng section kiến thức được dùng để trả lời.

---

### --- Use Case 2: Gợi ý Sản phẩm (Smart Recommendation) ---

- [ ] Tool `product_search_tool`
  - **Mục tiêu**: LangChain Tool kết hợp Vector Search (ChromaDB) và SQL Filter (MySQL) để tìm sản phẩm phù hợp.
  - **Output**: `app/services/ai_agent/tools/product_search.py`
  - **Input Tool**: `{ "query": str, "max_price"?: float, "min_price"?: float, "use_id"?: int }`
  - **Logic**:
    1. Vector search: tìm `product_id` có embedding mô tả gần nghĩa với `query` trong ChromaDB
    2. Nếu `use_id` không được cung cấp trực tiếp: query ChromaDB với metadata filter `use_name` để suy ra `use_id` tương ứng từ bảng `uses`
    3. SQL filter: `WHERE p.id IN (...) AND p.price <= max_price AND p.stock > 0` kết hợp `JOIN product_uses pu ON pu.product_id = p.id WHERE pu.use_id = ?` nếu có use filter
    4. Trả về danh sách sản phẩm dạng text cho LLM đọc, kèm `uses` đã gắn
  - **DoD**: Query `"đèn dưới 500k giúp ngủ ngon"` → trả về sản phẩm vừa ngữ nghĩa liên quan, vừa đúng filter giá, còn hàng, và ưu tiên sản phẩm có gắn tag `Trị mất ngủ`.

- [ ] API `POST /api/chat/recommend` — Endpoint gợi ý sản phẩm
  - **Request**: `{ "message": "Tôi muốn mua đèn trị mất ngủ dưới 500k" }`
  - **Logic**: Agent phân tích câu nói, gọi `product_search_tool`, tổng hợp kết quả thành câu trả lời tự nhiên kèm danh sách sản phẩm.
  - **Response**: `{ "answer": "...", "products": [ProductListItem] }`
  - **DoD**: Response có cả text giải thích và danh sách sản phẩm dạng object để frontend render card.

---

### --- Use Case 3: Hỗ trợ Đặt hàng qua Chat (Conversational Ordering) ---

- [ ] Tool `add_to_cart_tool`
  - **Mục tiêu**: LangChain Tool thêm sản phẩm vào giỏ hàng của user hiện tại.
  - **Output**: `app/services/ai_agent/tools/add_to_cart.py`
  - **Input Tool**: `{ "product_id": int, "quantity": int }`
  - **Logic**: Gọi service nội bộ để thêm vào giỏ (hoặc cập nhật session cart nếu chưa đăng nhập).
  - **DoD**: Tool gọi thành công → `CartItem` được tạo trong DB/session. Tool gọi với `product_id` không tồn tại → trả về error message cho Agent.

- [ ] Agent xử lý Conversational Ordering
  - **Mục tiêu**: Agent nhận câu chat, trích xuất `product_id` và `quantity`, gọi `add_to_cart_tool`.
  - **Output**: `app/services/ai_agent/agent.py` — `ConversationalOrderAgent`
  - **Ví dụ**:
    - User: _"Cho tôi mua 2 cái đèn đá muối hổ phách"_
    - Agent step 1: Dùng `product_search_tool` tìm đèn đá muối hổ phách → lấy `product_id`
    - Agent step 2: Gọi `add_to_cart_tool(product_id=X, quantity=2)`
    - Agent step 3: Xác nhận với user
  - **DoD**: Agent xác nhận thành công → sản phẩm xuất hiện trong giỏ hàng. Nếu hết hàng → Agent thông báo và gợi ý sản phẩm thay thế.

- [ ] API `POST /api/chat/order` — Endpoint Conversational Ordering
  - **Auth**: `Depends(get_current_user)` (phải đăng nhập mới đặt hàng qua chat)
  - **Request**: `{ "message": "Mua 1 đèn ngủ đá muối", "session_id": "..." }`
  - **Response**: `{ "answer": "...", "cart_updated": true, "cart_item"?: {...} }`
  - **DoD**: Request không có token → `401 Vui lòng đăng nhập để đặt hàng`.

---

### --- Use Case 4: Thống kê Báo cáo cho Admin (Text-to-SQL) ---

- [ ] Text-to-SQL Chain
  - **Mục tiêu**: Chain nhận câu hỏi ngôn ngữ tự nhiên từ Admin, sinh câu `SELECT` SQL an toàn, thực thi, và trả kết quả.
  - **Output**: `app/services/ai_agent/chains/admin_report.py`
  - **Logic**:
    1. Prompt cung cấp Schema DB (tên bảng, cột, quan hệ) cho LLM
    2. LLM sinh câu SQL dạng `SELECT` duy nhất
    3. **BẮT BUỘC**: Validate câu SQL — từ chối nếu chứa `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`
    4. Thực thi SQL và format kết quả thành text dễ đọc
  - **DoD**: `"Doanh thu hôm nay?"` → sinh `SELECT SUM(total_amount) FROM orders WHERE DATE(created_at) = CURDATE() AND status='delivered'` → thực thi → trả kết quả. Bất kỳ câu SQL nguy hiểm nào → bị block với lỗi rõ ràng.

- [ ] API `POST /api/admin/chat/report` — Endpoint Text-to-SQL
  - **Auth**: `Depends(require_admin)`
  - **Request**: `{ "message": "Top 5 sản phẩm bán chạy tháng này?" }`
  - **Response**:
    ```json
    {
      "answer": "Top 5 sản phẩm bán chạy tháng 3/2026 là...",
      "sql_query": "SELECT p.name, SUM(oi.quantity) as total_sold FROM ...",
      "raw_data": [...]
    }
    ```
  - **DoD**: Admin nhập câu hỏi bất kỳ về dữ liệu kinh doanh → nhận được câu trả lời chính xác. User thường không truy cập được endpoint này.

---

### --- Tích hợp & Kiểm thử AI ---

- [ ] Endpoint Chat tổng hợp — `POST /api/chat`
  - **Mục tiêu**: Một endpoint duy nhất cho frontend Chatbot — tự động routing đến đúng chain/agent dựa trên nội dung câu hỏi.
  - **Logic Routing**:
    - Intent `mua`/`thêm giỏ` → `ConversationalOrderAgent`
    - Intent `tìm`/`gợi ý`/`muốn mua` → Recommendation Agent
    - Còn lại → RAG Chain (tư vấn kiến thức)
  - **DoD**: Mọi loại câu hỏi chatbot đều qua endpoint này, frontend không cần biết routing nội bộ.

- [ ] Kiểm thử tích hợp AI End-to-End
  - **Mục tiêu**: Đảm bảo toàn bộ 4 use case hoạt động đúng trước khi tích hợp với frontend.
  - **Test cases tối thiểu**:
    - RAG: 5 câu hỏi kiến thức đèn đá muối → câu trả lời có nguồn tham chiếu
    - Recommendation: 3 câu hỏi với filter giá khác nhau → sản phẩm đúng
    - Ordering: Thêm sản phẩm qua chat → kiểm tra DB có `CartItem`
    - Text-to-SQL: 5 câu hỏi báo cáo + 3 câu SQL độc hại → bị block hết
  - **Output**: File `backend/tests/test_ai_agent.py`
  - **DoD**: Tất cả test cases pass. Coverage logic safety (SQL injection) = 100%.
