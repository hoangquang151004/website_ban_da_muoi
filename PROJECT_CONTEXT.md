# THÔNG TIN DỰ ÁN: WEBSITE E-COMMERCE ĐÈN ĐÁ MUỐI HIMALAYA TÍCH HỢP AI

## 1. Tổng quan Dự án (Project Overview)

Đây là đồ án tốt nghiệp ngành Công nghệ thông tin. Hệ thống bao gồm chức năng thương mại điện tử cốt lõi (bán đèn đá muối, đèn ngủ, đá ngâm chân) và hệ sinh thái AI Agent đóng vai trò là trợ lý ảo cho cả Khách hàng và Quản trị viên (Admin).
Mục tiêu code: Tối ưu, sạch sẽ, phân tách rõ ràng giữa Frontend và Backend.

## 2. Tech Stack (Công nghệ sử dụng)

- **Frontend:** Next.js (App Router), Tailwind CSS, TypeScript, Zustand (State), React Three Fiber (Hiển thị 3D).
- **Backend:** FastAPI (Python), SQLAlchemy (ORM).
- **Database:** MySQL (lưu trữ E-commerce cốt lõi) + ChromaDB/FAISS (Vector Database lưu trữ embedding cho RAG và AI).
- **AI Core:** LangChain, LangGraph (quản lý state và luồng Agent).

## 3. Quy tắc Code (Coding Guidelines)

- Viết API theo chuẩn RESTful. Response luôn có định dạng: `{ "status": "success/error", "data": {...}, "message": "..." }`.
- Frontend luôn gọi API thông qua một custom Axios instance.
- Mọi logic liên quan đến AI (Prompting, Vector Search, LLM Call) PHẢI được đặt trong thư mục `backend/app/services/ai_agent/`. Tuyệt đối không viết logic AI trong Controller (Router).

## 4. Đặc tả Nghiệp vụ E-commerce (Core Business)

- **Sản phẩm (Products):** Có tên, mô tả, giá, tồn kho (stock), danh mục và đặc biệt là `model_3d_url`.
- **Giỏ hàng & Thanh toán:** Khi thanh toán thành công, phải gọi transaction SQL để trừ `stock`. Nếu `stock` < số lượng mua, rollback ngay lập tức.

## 5. Đặc tả Nghiệp vụ AI (Lõi Đồ án - TRỌNG TÂM)

AI Agent trong dự án này phải xử lý được 4 Use Case chính sau. Khi yêu cầu viết code liên quan đến AI, hãy bám sát logic này:

1. **Chatbot Tư vấn Sản phẩm (Knowledge RAG):**
   - Nhiệm vụ: Trả lời kiến thức về công dụng sức khỏe, phong thủy của đèn đá muối.
   - Logic: Sử dụng `VectorStoreRetriever` truy vấn vào ChromaDB để lấy ngữ cảnh (Context) trước khi LLM trả lời. Không được tự bịa thông tin.

2. **Gợi ý Sản phẩm (Smart Recommendation):**
   - Nhiệm vụ: Tìm sản phẩm phù hợp với nhu cầu của khách (VD: "đèn trị mất ngủ dưới 500k").
   - Logic: Agent dùng Tool để kết hợp Vector Search (tìm sản phẩm có mô tả ngữ nghĩa "trị mất ngủ" trong ChromaDB) VÀ SQL Filter (lọc MySQL `WHERE price < 500000 AND stock > 0`).

3. **Hỗ trợ Đặt hàng qua Chat (Conversational Ordering):**
   - Nhiệm vụ: Trích xuất ý định mua hàng từ câu chat.
   - Logic: Agent dùng Tool `add_to_cart_tool`. LLM cần nhận diện ID sản phẩm và số lượng từ câu nói của khách, sau đó gọi API nội bộ để nhét sản phẩm vào giỏ hàng của user hiện tại.

4. **Thống kê Báo cáo cho Admin (Text-to-SQL):**
   - Nhiệm vụ: Chuyển câu hỏi ngôn ngữ tự nhiên của Admin (VD: "Doanh thu hôm nay?") thành lệnh SQL chạy trên MySQL.
   - Logic: Cung cấp Database Schema cho LLM. Sinh câu lệnh `SELECT`. Tuyệt đối không được sinh câu lệnh `INSERT`, `UPDATE`, `DELETE`, `DROP`.
