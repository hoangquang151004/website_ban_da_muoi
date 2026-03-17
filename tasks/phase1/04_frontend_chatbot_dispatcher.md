# Task 04 — Frontend: Chatbot Dispatcher (State + API Call + Render Router)

**Giai đoạn:** 1 - Foundation & Schema  
**Ưu tiên:** 🔴 P0 — Deliverable cuối cùng của Giai đoạn 1  
**Ước lượng:** 2–3 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`  
**Phụ thuộc:** Task 03 phải hoàn thành (types đã định nghĩa)

---

## Bối cảnh

`Chatbot.tsx` hiện là UI tĩnh hoàn toàn (hardcode tin nhắn mẫu, textarea không có handler).  
Task này biến nó thành component có state thật:

1. Lưu lịch sử messages.
2. Gọi `POST /api/v1/chat` khi user gửi tin.
3. Dispatch đúng **renderer component** dựa theo `response_type` từ backend.

---

## Công việc cần làm

### Bước 1 — Thêm state và API call logic

```typescript
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage, ChatApiResponse } from "@/types";

// Hàm gọi API chat
async function sendChatMessage(
  message: string,
  sessionId: string,
): Promise<ChatApiResponse> {
  const res = await fetch("/api/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Chat API error");
  const json = await res.json();
  return json.data as ChatApiResponse; // BaseResponse wrapper của backend
}
```

**State cần thêm:**

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([
  {
    id: "welcome",
    role: "bot",
    content:
      "Chào bạn! Tôi có thể giúp gì cho sức khỏe và không gian sống của bạn hôm nay?",
    response_type: "text",
    timestamp: Date.now(),
  },
]);
const [inputValue, setInputValue] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [sessionId] = useState(() => crypto.randomUUID());
const messagesEndRef = useRef<HTMLDivElement>(null);
```

**Handler gửi tin:**

```typescript
const handleSend = useCallback(async () => {
  const text = inputValue.trim();
  if (!text || isLoading) return;

  // 1. Thêm tin user
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: text,
    timestamp: Date.now(),
  };

  // 2. Thêm placeholder loading của bot
  const loadingMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "bot",
    content: "",
    isLoading: true,
    timestamp: Date.now(),
  };

  setMessages((prev) => [...prev, userMsg, loadingMsg]);
  setInputValue("");
  setIsLoading(true);

  try {
    const apiRes = await sendChatMessage(text, sessionId);

    // 3. Thay placeholder bằng response thật
    const botMsg: ChatMessage = {
      id: loadingMsg.id,
      role: "bot",
      content: apiRes.answer,
      response_type: apiRes.response_type,
      data: {
        products: apiRes.products ?? undefined,
        cart_item: apiRes.cart_item ?? undefined,
        orders: apiRes.orders ?? undefined,
        order_detail: apiRes.order_detail ?? undefined,
        stats_data: apiRes.stats_data ?? undefined,
        sources: apiRes.sources ?? undefined,
      },
      timestamp: Date.now(),
    };

    setMessages((prev) =>
      prev.map((m) => (m.id === loadingMsg.id ? botMsg : m)),
    );
  } catch {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === loadingMsg.id
          ? {
              ...m,
              isLoading: false,
              content: "Đã xảy ra lỗi, vui lòng thử lại.",
            }
          : m,
      ),
    );
  } finally {
    setIsLoading(false);
  }
}, [inputValue, isLoading, sessionId]);
```

**Auto-scroll:**

```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```

### Bước 2 — Tạo `MessageRenderer` component (cùng file hoặc file riêng)

```typescript
function MessageRenderer({ message }: { message: ChatMessage }) {
  if (message.isLoading) {
    return <TypingIndicator />;  // xem Bước 3
  }

  switch (message.response_type) {
    case "product_cards":
      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          {/* TODO Phase 2: <ProductCardList products={message.data?.products} /> */}
          <div className="text-xs text-slate-400 ml-1 mt-1">
            [Product cards — sẽ render ở Giai đoạn 2]
          </div>
        </>
      );

    case "checkout_form":
      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          {/* TODO Phase 3: <CheckoutPanel cartItem={message.data?.cart_item} /> */}
          <div className="text-xs text-slate-400 ml-1 mt-1">
            [Checkout panel — sẽ render ở Giai đoạn 3]
          </div>
        </>
      );

    case "order_list":
      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          {/* TODO Phase 4: <OrderListPanel orders={message.data?.orders} /> */}
          <div className="text-xs text-slate-400 ml-1 mt-1">
            [Order list — sẽ render ở Giai đoạn 4]
          </div>
        </>
      );

    case "order_detail":
      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          {/* TODO Phase 4: <OrderDetailPanel order={message.data?.order_detail} /> */}
        </>
      );

    case "stats":
      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          {/* TODO Phase 5: <StatsWidget data={message.data?.stats_data} /> */}
          <div className="text-xs text-slate-400 ml-1 mt-1">
            [Stats widget — sẽ render ở Giai đoạn 5]
          </div>
        </>
      );

    case "text":
    default:
      return <TextBubble content={message.content} role={message.role} />;
  }
}
```

> **Quy ước:** Các `TODO Phase N` là placeholder có chủ đích — mỗi giai đoạn sau thay thế 1 placeholder bằng component thật. Không xóa comment TODO cho đến khi component tương ứng hoàn thành.

### Bước 3 — Các helper components nhỏ

```typescript
// Bubble text đơn giản (dùng lại design hiện tại)
function TextBubble({ content, role }: { content: string; role: "user" | "bot" }) {
  if (role === "user") {
    return (
      <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none shadow-md text-sm leading-relaxed">
        {content}
      </div>
    );
  }
  return (
    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-slate-800 text-sm leading-relaxed border border-slate-100">
      {content}
    </div>
  );
}

// Typing indicator (3 chấm nhảy)
function TypingIndicator() {
  return (
    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex gap-1 items-center w-16">
      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
```

### Bước 4 — Cập nhật Chat Area để render từ `messages` state

Thay toàn bộ nội dung hardcode trong vùng `{/* Chat Area */}` bằng:

```tsx
<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-hide">
  {/* Date Separator */}
  <div className="flex justify-center">
    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-black/5 px-3 py-1 rounded-full">
      Hôm nay
    </span>
  </div>

  {messages.map((msg) => (
    <div
      key={msg.id}
      className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
    >
      {/* Avatar bot */}
      {msg.role === "bot" && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 text-primary">
          <span className="material-symbols-outlined text-lg">smart_toy</span>
        </div>
      )}

      <div
        className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : ""}`}
      >
        {msg.role === "bot" && (
          <span className="text-[11px] text-slate-500 ml-1">Trợ lý AI</span>
        )}
        <MessageRenderer message={msg} />
        {msg.role === "user" && (
          <span className="text-[10px] text-slate-500 mr-1">
            {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  ))}

  <div ref={messagesEndRef} />
</div>
```

### Bước 5 — Wire textarea và nút gửi

```tsx
<textarea
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }}
  disabled={isLoading}
  placeholder="Hỏi tôi bất cứ điều gì..."
  rows={1}
  className="..."
/>
<button
  onClick={handleSend}
  disabled={isLoading || !inputValue.trim()}
  className="..."
>
  <span className="material-symbols-outlined text-[18px]">send</span>
</button>
```

---

## Definition of Done (DoD)

- [ ] Gõ tin nhắn và nhấn Enter / nút gửi → tin user xuất hiện ngay lập tức.
- [ ] Bot hiện typing indicator (3 chấm) trong lúc chờ API.
- [ ] API trả về → typing indicator biến mất, tin bot hiện đúng nội dung.
- [ ] `console.log(message.response_type)` in ra đúng giá trị từ backend (verify qua DevTools).
- [ ] Các `response_type` khác `"text"` hiển thị đúng placeholder "[... — sẽ render ở Giai đoạn N]".
- [ ] Chat area tự scroll xuống sau mỗi tin mới.
- [ ] Gửi khi input rỗng → không call API.
- [ ] API lỗi (network error) → hiện thông báo lỗi thân thiện, không crash app.
- [ ] Không có TypeScript error (`tsc --noEmit` clean).

---

## Ghi chú

- Giữ nguyên toàn bộ CSS/design hiện tại, chỉ thêm state/logic, không redesign.
- Proxy `/api/v1/chat` đã được cấu hình trong `frontend/src/proxy.ts` hoặc `next.config.ts` — kiểm tra trước khi test.
- `sessionId` dùng `crypto.randomUUID()` — chỉ tạo 1 lần khi component mount, không đổi giữa các tin.
- Quick Suggestion buttons (Đèn cho phòng khách, Công dụng đá muối?) cũng nên gọi `handleSend` với nội dung tương ứng khi click.
