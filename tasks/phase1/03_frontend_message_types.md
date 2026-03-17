# Task 03 — Frontend: Định nghĩa TypeScript Types cho Chat

**Giai đoạn:** 1 - Foundation & Schema  
**Ưu tiên:** 🔴 P0 — Nền tảng type-safe cho toàn bộ frontend chatbot  
**Ước lượng:** 1 giờ  
**File chính:** `frontend/src/types/index.ts`  
**Phụ thuộc:** Task 01 phải hoàn thành (JSON contract v1 đã chốt)

---

## Bối cảnh

Frontend hiện có `src/types/index.ts` chứa các type cho Product, Cart, User, Order nhưng **chưa có type nào cho hệ thống chatbot**.  
Task này định nghĩa đầy đủ TypeScript interface cho:

1. `ChatResponseType` — mirroring `ResponseType` literal từ backend.
2. `ChatApiResponse` — shape của response từ `POST /api/v1/chat`.
3. `ChatMessage` — model cho 1 tin nhắn trong UI chat (bao gồm cả tin user và tin bot).

---

## Công việc cần làm

### Bước 1 — Thêm Chat types vào `src/types/index.ts`

Append vào cuối file:

```typescript
// ============================================================
// Chat / Chatbot types
// ============================================================

/** Tương ứng với ResponseType Literal ở Backend */
export type ChatResponseType =
  | "text" // Câu trả lời văn bản / RAG
  | "product_cards" // Danh sách sản phẩm
  | "checkout_form" // Form checkout nhúng
  | "order_list" // Danh sách đơn hàng
  | "order_detail" // Chi tiết 1 đơn hàng
  | "stats"; // Widgets thống kê admin

/** Product nhỏ gọn dùng trong product card của chat */
export interface ChatProductCard {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  slug: string;
  stock: number;
  short_description?: string | null;
}

/** Tóm tắt đơn hàng trong chat (cho order_list) */
export interface ChatOrderSummary {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  items_count?: number;
}

/** Chi tiết đơn hàng trong chat (cho order_detail) */
export interface ChatOrderDetail {
  id: number;
  status: string;
  total_amount: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  payment_method: string;
  note?: string | null;
  created_at: string;
  items: Array<{
    product_name: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    image_url?: string | null;
  }>;
}

/** Dữ liệu thống kê (cho stats widget) */
export interface ChatStatsData {
  total_revenue?: number;
  total_orders?: number;
  top_products?: Array<{ name: string; total_sold: number; revenue: number }>;
  order_status_distribution?: Array<{ status: string; count: number }>;
}

/** Response trả về từ POST /api/v1/chat */
export interface ChatApiResponse {
  answer: string;
  response_type: ChatResponseType;
  intent?: string | null;
  // product_cards
  products?: ChatProductCard[] | null;
  sources?: Array<{ title: string; snippet: string }> | null;
  // checkout_form
  cart_updated?: boolean | null;
  cart_item?: {
    product_id: number;
    quantity: number;
    unit_price: number;
  } | null;
  // order_list / order_detail
  orders?: ChatOrderSummary[] | null;
  order_detail?: ChatOrderDetail | null;
  // stats
  stats_data?: ChatStatsData | null;
}

/** 1 tin nhắn trong UI chat */
export interface ChatMessage {
  id: string; // uuid hoặc timestamp string
  role: "user" | "bot";
  content: string; // Text hiển thị
  response_type?: ChatResponseType; // Chỉ có ở tin bot
  data?: {
    // Payload kèm theo cho renderer
    products?: ChatProductCard[];
    cart_item?: ChatApiResponse["cart_item"];
    orders?: ChatOrderSummary[];
    order_detail?: ChatOrderDetail;
    stats_data?: ChatStatsData;
    sources?: ChatApiResponse["sources"];
  };
  timestamp: number; // Date.now()
  isLoading?: boolean; // Skeleton state khi chờ bot reply
}
```

---

## Definition of Done (DoD)

- [ ] File `src/types/index.ts` được append đủ 8 interface/type mới mà không phá vỡ các type cũ.
- [ ] Không có TypeScript error khi chạy `tsc --noEmit`.
- [ ] Import thử trong `Chatbot.tsx`: `import type { ChatMessage, ChatApiResponse } from "@/types"` không báo lỗi.
- [ ] `ChatResponseType` khớp 1:1 với Literal ở backend (6 giá trị).

---

## Ghi chú

- Tất cả field optional (`?`) cho đúng với thực tế backend trả về tùy intent.
- `ChatMessage.id` nên dùng `crypto.randomUUID()` hoặc `Date.now().toString()` tại nơi tạo.
- `isLoading: true` dùng để hiển thị skeleton "bot đang trả lời..." trước khi có response.
- File này là điều kiện tiên quyết của Task 04 (Chatbot dispatcher).
