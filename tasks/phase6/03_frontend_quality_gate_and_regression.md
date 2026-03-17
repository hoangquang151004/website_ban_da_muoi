# Task 03 — Frontend: Thiết lập quality gate và chặn regression

**Giai đoạn:** 6 - Hardening và QA  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2 giờ  
**File chính:** `frontend/package.json`, `frontend/ts_error.txt`, `frontend/eslint-output.txt`

---

## Bối cảnh

Frontend hiện đã có dấu hiệu lỗi tồn tại sẵn:

- TypeScript error trong `admin/customers/page.tsx`
- ESLint error trong `app/(shop)/cart/page.tsx`

Trước khi chốt chatbot phases, cần có quality gate rõ ràng để biết lỗi nào là cũ, lỗi nào là do thay đổi mới.

---

## Công việc cần làm

### Bước 1 — Chuẩn hóa lệnh kiểm tra

Bổ sung/định nghĩa rõ các lệnh cần chạy:

```json
{
  "scripts": {
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  }
}
```

> Nếu `typecheck` chưa có trong `package.json`, cần thêm.

### Bước 2 — Chạy baseline và cập nhật file ghi nhận

Chạy:

```bash
cd frontend
npm run lint
npm run typecheck
```

Cập nhật `eslint-output.txt` và `ts_error.txt` để làm baseline.

### Bước 3 — Quy ước gate cho chatbot work

Mục tiêu thực tế của phase này:

- **không tạo thêm lỗi TypeScript/ESLint mới** trong các file chatbot liên quan
- nếu chưa dọn hết lỗi cũ toàn dự án, phải ghi rõ baseline existing issues

### Bước 4 — Kiểm tra các file chatbot trọng yếu

Ít nhất phải clean ở các file:

- `src/components/shop/Chatbot.tsx`
- `src/services/chatService.ts`
- `src/services/adminChatService.ts` (nếu có)
- `src/types/index.ts`

---

## Definition of Done (DoD)

- [ ] Có lệnh `npm run typecheck`.
- [ ] Có baseline rõ cho `eslint` và `tsc`.
- [ ] File chatbot mới/chỉnh sửa không phát sinh lỗi lint/typecheck mới.
- [ ] Các lỗi cũ ngoài phạm vi chatbot được ghi nhận, không âm thầm bỏ qua.

---

## Ghi chú

- Không nên chặn release chatbot vì toàn bộ repo còn lỗi cũ không liên quan, nhưng phải ghi rõ phần nợ kỹ thuật.
- Nếu có thời gian, sửa luôn lỗi cũ nhỏ đang chắn `typecheck` để việc kiểm tra dễ hơn về sau.
