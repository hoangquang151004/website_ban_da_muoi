# Task 06 — Frontend: Quick Suggestions và hành vi chat usable

**Giai đoạn:** 2 - Tư vấn sản phẩm & CSKH  
**Ưu tiên:** 🟡 P2  
**Ước lượng:** 1 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`

---

## Bối cảnh

Hiện `Chatbot.tsx` có 2 nút quick suggestion nhưng chỉ là UI tĩnh.  
Nếu không nối logic, trải nghiệm demo sẽ yếu dù API đã chạy thật.

---

## Công việc cần làm

### Bước 1 — Chuẩn hóa mảng quick suggestions

Tạo một mảng constant:

```ts
const QUICK_SUGGESTIONS = [
  "Đèn cho phòng khách",
  "Công dụng đá muối?",
  "Gợi ý đèn cho người mất ngủ",
  "Chính sách bảo hành thế nào?",
];
```

### Bước 2 — Click suggestion sẽ gửi chat ngay

Tạo helper:

```ts
const handleQuickSuggestion = async (text: string) => {
  if (isLoading) return;
  setInputValue(text);
  await handleSend(text);
};
```

> Nếu `handleSend()` hiện không nhận argument, refactor thành:

```ts
const handleSend = async (overrideText?: string) => {
  const text = (overrideText ?? inputValue).trim();
  ...
}
```

### Bước 3 — Disable khi đang loading

Quick buttons phải bị disabled khi bot đang xử lý request để tránh spam.

### Bước 4 — Gợi ý thông minh theo context (optional)

Sau khi bot trả `product_cards`, có thể thay quick suggestions tạm thời bằng:

- `Mẫu nào phù hợp cho phòng ngủ?`
- `Có loại dưới 500k không?`
- `Tư vấn thêm về bảo hành`

Phase 2 chỉ cần hardcoded list là đủ.

---

## Definition of Done (DoD)

- [ ] Click quick suggestion sẽ gửi chat thật.
- [ ] Không cần gõ tay vẫn demo được cả luồng product và policy QA.
- [ ] Khi loading, button bị disable và không gửi trùng request.
- [ ] Không phá layout vùng input hiện có.

---

## Ghi chú

- Đây không phải task bắt buộc về logic, nhưng rất đáng làm vì tăng chất lượng demo rõ rệt.
- Có thể gộp task này vào Task 03 nếu muốn giảm số file.
