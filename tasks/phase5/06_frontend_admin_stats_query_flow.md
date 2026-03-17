# Task 06 — Frontend: Luồng hỏi thống kê admin trong chat

**Giai đoạn:** 5 - Thống kê admin  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 2 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`

---

## Bối cảnh

Phase 5 không chỉ là render widget; chatbot còn phải biết khi nào nên:

- gọi dữ liệu REST structured
- gọi Text-to-SQL
- từ chối nếu user không phải admin

Task này hoàn thiện orchestration ở frontend nếu team chọn hybrid ở UI, hoặc tối thiểu thêm UX cho admin query flow.

---

## Công việc cần làm

### Phương án khuyến nghị

**Ưu tiên để backend làm router chính** qua `POST /api/v1/chat`.  
Frontend chỉ cần gửi message như bình thường và render theo `response_type = stats`.

Nếu backend đã làm xong Task 01 + 02 phase 5, frontend chủ yếu cần:

- hiển thị quick actions cho admin
- show unauthorized fallback rõ ràng
- support follow-up question

### Bước 1 — Thêm quick prompts cho admin

Nếu user role là admin, hiển thị thêm gợi ý:

- `Doanh thu tháng này`
- `Top sản phẩm bán chạy`
- `Tỷ lệ trạng thái đơn`
- `Báo cáo doanh thu theo danh mục`

### Bước 2 — Unauthorized UX

Nếu bot trả text kiểu `chỉ dành cho quản trị viên`:

- render như text bình thường
- có thể thêm icon lock nhỏ hoặc badge `Admin only`

### Bước 3 — Follow-up queries

Cho phép admin hỏi tiếp kiểu:

- `còn tuần trước thì sao?`
- `lọc 30 ngày gần nhất`
- `top 10 sản phẩm`

Phase 5 chưa cần memory context phức tạp; chỉ cần giữ history chat như hiện tại.

### Bước 4 — Optional frontend hybrid

Nếu backend chưa kịp implement `run_stats_agent()`, có thể fallback tạm ở frontend:

- quick prompts cố định → gọi `adminStatisticsService`
- câu tự do → gọi `adminChatService.askReport()`

Nhưng đây chỉ là phương án dự phòng. Kiến trúc tốt hơn vẫn là để backend quyết định.

---

## Definition of Done (DoD)

- [ ] Admin có quick prompts cho thống kê trong chat.
- [ ] User thường hỏi thống kê → được từ chối rõ ràng.
- [ ] Admin hỏi thống kê → nhận được response usable trong chat.
- [ ] Có thể follow-up bằng câu hỏi tiếp theo mà không phá flow chat.

---

## Ghi chú

- Không nên hardcode quá nhiều logic business stats ở frontend nếu backend unified route đã xử lý được.
- Task này thiên về UX/orchestration hơn là business logic.
