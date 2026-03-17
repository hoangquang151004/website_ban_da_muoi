# Task 05 — Frontend: Render `stats` widget trong Chatbot

**Giai đoạn:** 5 - Thống kê admin  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2–4 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`  
**Tham chiếu:** `frontend/src/app/admin/statistics/page.tsx`

---

## Bối cảnh

`Chatbot.tsx` hiện mới có placeholder cho `response_type = "stats"`.  
Task này thay thế placeholder bằng widget thật, tái sử dụng visual patterns từ trang admin statistics.

---

## Công việc cần làm

### Bước 1 — Tạo `StatsWidgetRenderer`

Props:

```ts
function StatsWidgetRenderer({
  statsData,
  meta,
}: {
  statsData?: ChatStatsData;
  meta?: { source?: "rest" | "text_to_sql" };
});
```

### Bước 2 — Render theo `widget_type`

Hỗ trợ tối thiểu 5 mode:

- `kpi`
- `revenue_chart`
- `top_products`
- `order_status`
- `table`

Ví dụ switch:

```tsx
switch (statsData?.widget_type) {
  case "kpi":
    return <KpiCardGrid items={statsData.items} />;
  case "revenue_chart":
    return <MiniRevenueChart items={statsData.items} />;
  case "top_products":
    return <TopProductsList items={statsData.items} />;
  case "order_status":
    return <OrderStatusMiniDonut items={statsData.items} />;
  case "table":
    return (
      <SqlResultTable rows={statsData.rows} sqlQuery={statsData.sql_query} />
    );
  default:
    return null;
}
```

### Bước 3 — Tái sử dụng helper từ admin statistics page

Có thể copy/rút gọn hoặc tách reuse các helper:

- `fmtVND`
- label status
- màu trạng thái
- mini bar chart / donut chart

Nhưng phải **nén layout cho chat**:

- nhỏ gọn hơn page admin
- nội dung ưu tiên đọc nhanh
- có scroll ngang cho table nếu cần

### Bước 4 — Gắn vào `MessageRenderer`

Thay placeholder `stats`:

```tsx
case "stats":
  return (
    <>
      <TextBubble content={message.content} role={message.role} />
      <StatsWidgetRenderer
        statsData={message.data?.stats_data}
        meta={message.data?.meta}
      />
    </>
  );
```

### Bước 5 — Phân biệt nguồn dữ liệu

Nếu `meta.source === "text_to_sql"`:

- hiển thị badge `Truy vấn linh hoạt`
- có thể cho phép expand/collapse `sql_query`

Nếu `meta.source === "rest"`:

- hiển thị badge `Dữ liệu chuẩn`

---

## Definition of Done (DoD)

- [ ] `response_type = stats` hiển thị widget thật, không còn placeholder.
- [ ] Có thể render cả `rest` widget và `text_to_sql` table.
- [ ] Widget đọc được trong width nhỏ của chatbot.
- [ ] Không copy nguyên trang admin statistics vào chat.

---

## Ghi chú

- `table` mode không cần quá đẹp; ưu tiên dễ đọc và không vỡ layout.
- Nếu thiếu thời gian, ưu tiên hoàn thành `kpi`, `top_products`, `table` trước.
