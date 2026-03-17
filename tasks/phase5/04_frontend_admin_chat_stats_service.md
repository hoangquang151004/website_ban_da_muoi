# Task 04 — Frontend: Tạo service cho thống kê admin trong chat

**Giai đoạn:** 5 - Thống kê admin  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 1 giờ  
**File chính:** `frontend/src/services/adminChatService.ts`

---

## Bối cảnh

Frontend đã có `adminStatisticsService.ts` cho REST thống kê, nhưng chưa có service riêng để gọi `POST /api/v1/admin/chat/report` cho nhánh Text-to-SQL.

Task này tạo service để chatbot admin có thể dùng cả 2 nguồn dữ liệu:

- REST structured stats
- Text-to-SQL free-form report

---

## Công việc cần làm

### Bước 1 — Tạo `adminChatService.ts`

```ts
import httpClient from "@/lib/httpClient";

export interface AdminChatReportResponse {
  answer: string;
  sql_query?: string;
  raw_data?: Record<string, unknown>[];
  error?: string;
}

export const adminChatService = {
  async askReport(message: string): Promise<AdminChatReportResponse> {
    const { data } = await httpClient.post("/admin/chat/report", { message });
    return (data?.data ?? data) as AdminChatReportResponse;
  },
};
```

### Bước 2 — Re-export hoặc dùng song song với `adminStatisticsService`

Không cần gộp 2 service vào 1 file. Giữ tách biệt:

- `adminStatisticsService` → dữ liệu REST structured
- `adminChatService` → truy vấn tự do Text-to-SQL

### Bước 3 — Chuẩn bị types cho chat stats

Nếu `src/types/index.ts` chưa có đủ type cho `stats_data`, bổ sung:

- `widget_type`
- `meta.source`
- `rows` cho table mode
- `items` cho widget mode

---

## Definition of Done (DoD)

- [ ] Có file `frontend/src/services/adminChatService.ts`.
- [ ] Gọi `POST /admin/chat/report` được và unwrap đúng `data`.
- [ ] Không ảnh hưởng service stats REST hiện có.
- [ ] Có type rõ ràng cho response Text-to-SQL.

---

## Ghi chú

- Do `httpClient` đã đính token, không cần xử lý auth riêng ở service này.
- 401/403 sẽ do interceptor hoặc UI handler xử lý ở component.
