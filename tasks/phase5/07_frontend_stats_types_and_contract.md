# Task 07 — Frontend: Chuẩn hóa types cho `stats_data` và `meta`

**Giai đoạn:** 5 - Thống kê admin  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 1 giờ  
**File chính:** `frontend/src/types/index.ts`

---

## Bối cảnh

Ở các phase trước, `ChatStatsData` mới chỉ là type tương đối rộng. Khi bước vào Phase 5, frontend cần contract rõ hơn để render nhiều widget mà không phải dùng `any`.

---

## Công việc cần làm

### Bước 1 — Mở rộng `ChatStatsData`

Đề xuất type:

```ts
export type ChatStatsWidgetType =
  | "kpi"
  | "revenue_chart"
  | "top_products"
  | "order_status"
  | "table";

export interface ChatStatsMeta {
  source?: "rest" | "text_to_sql";
}

export interface ChatStatsData {
  widget_type: ChatStatsWidgetType;
  items?: unknown[];
  rows?: Record<string, unknown>[];
  summary?: Record<string, unknown> | null;
  sql_query?: string | null;
  date_from?: string;
  date_to?: string;
}
```

### Bước 2 — Gắn `meta` vào `ChatApiResponse` và `ChatMessage.data`

Trong `ChatApiResponse`:

```ts
meta?: ChatStatsMeta | null;
```

Trong `ChatMessage.data`:

```ts
meta?: ChatStatsMeta;
```

### Bước 3 — Tránh `any`

Nếu component render phải ép kiểu theo từng widget, dùng type narrowing theo `widget_type` thay vì `any`.

---

## Definition of Done (DoD)

- [ ] `stats_data` có type rõ ràng.
- [ ] `meta.source` được type hóa.
- [ ] `Chatbot.tsx` import types không cần `any` cho stats widget.
- [ ] Contract frontend khớp với backend phase 5.

---

## Ghi chú

- Nếu muốn chặt hơn nữa, có thể dùng discriminated union cho từng `widget_type`.
- Nhưng ở phase này, một base interface có `widget_type` là đủ thực dụng.
