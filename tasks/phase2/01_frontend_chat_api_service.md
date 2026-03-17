# Task 01 — Frontend: Tạo Chat Service gọi API thật

**Giai đoạn:** 2 - Tư vấn sản phẩm & CSKH  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 1 giờ  
**File chính:** `frontend/src/services/chatService.ts`

---

## Bối cảnh

`Chatbot.tsx` sẽ gọi `POST /api/v1/chat`, nhưng hiện frontend chưa có service riêng cho chat.  
Task này tách phần gọi API ra khỏi component để dễ bảo trì, reuse và test.

---

## Công việc cần làm

### Bước 1 — Tạo file `src/services/chatService.ts`

Dùng `httpClient` hiện có ở `src/lib/httpClient.ts`.

```ts
import httpClient from "@/lib/httpClient";
import type { ChatApiResponse } from "@/types";

export interface SendChatMessagePayload {
  message: string;
  session_id?: string;
}

export const chatService = {
  async sendMessage(payload: SendChatMessagePayload): Promise<ChatApiResponse> {
    const { data } = await httpClient.post("/chat", payload);
    return (data?.data ?? data) as ChatApiResponse;
  },
};
```

### Bước 2 — Chuẩn hóa xử lý lỗi

- Nếu backend trả lỗi 4xx/5xx, để exception bubble lên `Chatbot.tsx`.
- Không tự `alert()` trong service.
- `Chatbot.tsx` sẽ hiển thị lỗi thân thiện trong bubble.

### Bước 3 — Chuẩn bị chỗ mở rộng cho file upload sau này

Thêm comment TODO:

```ts
// TODO Phase 6: hỗ trợ upload image/file vào chat nếu backend cho phép
```

---

## Definition of Done (DoD)

- [ ] Có file `frontend/src/services/chatService.ts`.
- [ ] `chatService.sendMessage()` gọi đúng `POST /chat`.
- [ ] Response unwrap đúng shape `BaseResponse.data`.
- [ ] Import vào `Chatbot.tsx` chạy không lỗi TypeScript.

---

## Ghi chú

- Endpoint thực tế đã là `/api/v1/chat` ở backend; `httpClient` đã có `baseURL=/api/v1`.
- Task này là điều kiện tiên quyết của task renderer trong Giai đoạn 2.
