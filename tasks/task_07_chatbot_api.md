# Task 07 — Kết nối Chatbot với AI Agent API

**Ước tính:** 90 phút  
**Phụ thuộc:** Task 01 hoàn thành, Backend đang chạy  
**File cần tạo:** `frontend/src/services/chatService.ts`  
**File cần sửa:** `frontend/src/components/shop/Chatbot.tsx`

---

## Vấn đề hiện tại

`Chatbot.tsx` chỉ có `useState(isOpen)` để toggle hiện/ẩn.  
Không có message state, không gọi API — giao diện trống.

---

## Bước 1 — Tạo `frontend/src/services/chatService.ts`

```typescript
import httpClient from "@/lib/httpClient";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ProductCard[];
  timestamp: Date;
  intent?: "rag" | "recommend" | "order" | "sql";
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  average_rating?: number;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_id?: number | null;
}

export interface ChatResponse {
  answer: string;
  intent: string;
  session_id: string;
  products?: ProductCard[];
  sources?: { source: string; content: string }[];
}

export const chatService = {
  async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    const { data } = await httpClient.post("/chat", payload);
    // Backend trả BaseResponse<ChatResponse>
    return data?.data ?? data;
  },

  async sendKnowledgeQuery(
    message: string,
    session_id?: string,
  ): Promise<ChatResponse> {
    const { data } = await httpClient.post("/chat/knowledge", {
      message,
      session_id,
    });
    return data?.data ?? data;
  },

  async sendRecommendQuery(
    message: string,
    session_id?: string,
  ): Promise<ChatResponse> {
    const { data } = await httpClient.post("/chat/recommend", {
      message,
      session_id,
    });
    return data?.data ?? data;
  },

  // Yêu cầu đăng nhập
  async sendOrderRequest(
    message: string,
    session_id?: string,
  ): Promise<ChatResponse> {
    const { data } = await httpClient.post("/chat/order", {
      message,
      session_id,
    });
    return data?.data ?? data;
  },
};
```

---

## Bước 2 — Viết lại `Chatbot.tsx`

### Cấu trúc state cần thêm

```tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { chatService, ChatMessage } from "@/services/chatService";
import { v4 as uuidv4 } from "uuid"; // hoặc dùng Date.now().toString()

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý AI của Himalayan Salt Shop. Tôi có thể giúp bạn tìm sản phẩm, tư vấn đèn đá muối phù hợp, hoặc giải đáp câu hỏi về sản phẩm. Bạn cần hỗ trợ gì?",
  timestamp: new Date(),
};

const [isOpen, setIsOpen] = useState(false);
const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
const [inputValue, setInputValue] = useState("");
const [isTyping, setIsTyping] = useState(false);
const [sessionId] = useState(() => uuidv4()); // persistent per Tab
const messagesEndRef = useRef<HTMLDivElement>(null);
```

### Auto-scroll khi có message mới

```tsx
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, isTyping]);
```

### Hàm gửi tin nhắn

```tsx
const handleSend = async () => {
  const text = inputValue.trim();
  if (!text || isTyping) return;

  // Thêm tin nhắn user ngay lập tức
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: "user",
    content: text,
    timestamp: new Date(),
  };
  setMessages((prev) => [...prev, userMessage]);
  setInputValue("");
  setIsTyping(true);

  try {
    const response = await chatService.sendMessage({
      message: text,
      session_id: sessionId,
    });

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.answer,
      products: response.products,
      intent: response.intent as any,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  } catch (err) {
    const errorMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};
```

### Xử lý Enter để gửi

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

### Render tin nhắn + product cards

```tsx
{
  messages.map((msg) => (
    <div
      key={msg.id}
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[80%] ${
          msg.role === "user"
            ? "bg-orange-500 text-white rounded-l-2xl rounded-br-2xl"
            : "bg-white text-slate-800 rounded-r-2xl rounded-bl-2xl shadow-sm"
        } px-4 py-2`}
      >
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

        {/* Hiển thị product cards nếu có */}
        {msg.products && msg.products.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {msg.products.map((p) => (
              <a
                key={p.id}
                href={`/product/${p.slug}`}
                className="block bg-orange-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-24 object-cover"
                  />
                )}
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-800 line-clamp-2">
                    {p.name}
                  </p>
                  <p className="text-xs text-orange-600 font-semibold mt-1">
                    {p.price.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  ));
}

{
  /* Typing indicator */
}
{
  isTyping && (
    <div className="flex justify-start mb-3">
      <div className="bg-white rounded-r-2xl rounded-bl-2xl px-4 py-2 shadow-sm">
        <div className="flex space-x-1">
          <div
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
<div ref={messagesEndRef} />;
```

### Gợi ý nhanh (quick replies)

```tsx
const QUICK_SUGGESTIONS = [
  "Đèn đá muối loại nào phù hợp với phòng ngủ?",
  "Sản phẩm đang khuyến mãi",
  "Đá muối có tác dụng gì?",
  "Đèn giá dưới 500k",
];

{
  messages.length === 1 && (
    <div className="px-4 pb-3 flex flex-wrap gap-2">
      {QUICK_SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => setInputValue(s)}
          className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-3 py-1 hover:bg-orange-100 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
```

---

## Bước 3 — Cài package uuid (nếu chưa có)

```bash
cd frontend
npm install uuid
npm install @types/uuid --save-dev
```

Hoặc không dùng uuid, thay bằng:

```tsx
const [sessionId] = useState(
  () => `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
);
```

---

## Kiểm tra hoàn thành (DoD)

- [ ] Nút chat nổi (FAB) → click → chat window mở
- [ ] Tin nhắn chào mừng hiển thị khi mở lần đầu
- [ ] Gợi ý nhanh (4 nút) → click → điền vào input
- [ ] Gửi tin nhắn → typing indicator → nhận câu trả lời từ AI
- [ ] Câu trả lời tư vấn/recommend → hiển thị product cards
- [ ] Click vào product card → điều hướng về trang chi tiết sản phẩm
- [ ] Enter → gửi, Shift+Enter → xuống dòng
- [ ] Auto-scroll xuống cuối khi có message mới
- [ ] Đóng chat → mở lại → messages vẫn còn (không reset trong session)
