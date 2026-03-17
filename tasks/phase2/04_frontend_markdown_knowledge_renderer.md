# Task 04 — Frontend: Render câu trả lời CSKH bằng Markdown

**Giai đoạn:** 2 - Tư vấn sản phẩm & CSKH  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 1–2 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`  
**Phụ thuộc:** Chat service và dispatcher đã hoạt động

---

## Bối cảnh

Câu trả lời RAG về chính sách, bảo hành, phí ship thường dài và có cấu trúc.  
Nếu render như plain text, trải nghiệm đọc sẽ kém.  
Task này cho phép bot render Markdown trong bubble khi `response_type = "text"` và nội dung nhiều dòng.

---

## Công việc cần làm

### Bước 1 — Cài package

Cài thêm:

```bash
npm install react-markdown remark-gfm
```

### Bước 2 — Tạo `MarkdownBubble`

Trong `Chatbot.tsx` hoặc component riêng:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MarkdownBubble({ content }: { content: string }) {
  return (
    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-slate-800 text-sm leading-relaxed border border-slate-100 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
```

### Bước 3 — Heuristic chọn `TextBubble` hay `MarkdownBubble`

Trong `MessageRenderer`, với nhánh `text`:

```tsx
const shouldRenderMarkdown =
  message.role === "bot" &&
  (message.content.includes("\n") ||
    message.content.includes("- ") ||
    message.content.includes("**"));

return shouldRenderMarkdown ? (
  <MarkdownBubble content={message.content} />
) : (
  <TextBubble content={message.content} role={message.role} />
);
```

### Bước 4 — Render nguồn `sources` nếu có

Ngay dưới bubble bot, nếu `message.data?.sources?.length`:

```tsx
<div className="mt-2 flex flex-wrap gap-1">
  {message.data.sources.map((source, index) => (
    <span
      key={`${source.title}-${index}`}
      className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500"
      title={source.snippet}
    >
      {source.title}
    </span>
  ))}
</div>
```

---

## Definition of Done (DoD)

- [ ] Bot trả lời nhiều dòng được render đúng Markdown.
- [ ] Bullet list, đậm/nhạt, xuống dòng hiển thị đẹp trong bubble.
- [ ] `sources` được hiển thị dạng badge nhỏ phía dưới tin bot.
- [ ] Không làm ảnh hưởng tới user bubble.

---

## Ghi chú

- Không cho phép render HTML raw.
- Chỉ dùng Markdown cho tin bot; user message vẫn render text thường.
- Nếu team không muốn thêm dependency, có thể tạm render `white-space: pre-wrap`, nhưng Markdown renderer là hướng đúng hơn.
