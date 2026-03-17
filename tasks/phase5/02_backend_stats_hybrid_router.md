# Task 02 — Backend: Router thống kê hybrid (`REST` vs `Text-to-SQL`)

**Giai đoạn:** 5 - Thống kê admin  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2–3 giờ  
**File chính:** `backend/app/services/ai_agent/agent.py`

---

## Bối cảnh

Theo kế hoạch, thống kê admin trong chat có 2 con đường:

- `REST` cho câu hỏi theo mẫu cố định, dữ liệu chuẩn hóa, render widget đẹp
- `Text-to-SQL` cho câu hỏi tự do, linh hoạt

Task này implement `run_stats_agent()` để chọn đúng đường xử lý.

---

## Công việc cần làm

### Bước 1 — Phân loại câu hỏi stats theo template

Tạo helper trong `agent.py`:

```python
def _detect_stats_mode(message: str) -> str:
    lower = message.lower()

    if any(k in lower for k in ["doanh thu", "kpi", "top sản phẩm", "sản phẩm bán chạy", "trạng thái đơn", "tồn kho thấp"]):
        return "rest"

    return "text_to_sql"
```

> Có thể tinh chỉnh thêm: nếu câu hỏi quá cụ thể kiểu “top 5 sản phẩm bán chạy tháng này” vẫn có thể đi REST nếu map được.

### Bước 2 — Implement nhánh `REST`

Tạo helper `run_stats_rest_agent(message: str) -> dict`.

Gợi ý mapping tối thiểu:

- `doanh thu` → `svc.get_revenue_chart()` hoặc `svc.get_kpi_stats()`
- `top sản phẩm` / `bán chạy` → `svc.get_top_products()`
- `trạng thái đơn` → `svc.get_order_status_distribution()`
- `kpi` / `tổng quan` → `svc.get_kpi_stats()`

**Lưu ý kỹ thuật:**

- Không gọi HTTP loopback tới router.
- Gọi trực tiếp `app.services.crud.admin_statistics` bằng `AsyncSession`.

Output ví dụ:

```python
{
    "answer": "Đây là top sản phẩm bán chạy trong 30 ngày gần nhất.",
    "stats_data": {
        "widget_type": "top_products",
        "items": [...],
        "date_from": "2026-02-12",
        "date_to": "2026-03-13",
    },
    "meta": {"source": "rest"},
}
```

### Bước 3 — Implement nhánh `Text-to-SQL`

Trong `run_stats_agent()`:

```python
if mode == "text_to_sql":
    from app.services.ai_agent.chains.admin_report import run_admin_report
    result = await run_admin_report(message)
    return {
        "answer": result["answer"],
        "stats_data": {
            "widget_type": "table",
            "rows": result.get("raw_data", []),
            "sql_query": result.get("sql_query"),
        },
        "meta": {"source": "text_to_sql"},
    }
```

### Bước 4 — Chuẩn hóa schema `stats_data`

Đề xuất shape:

```python
stats_data = {
    "widget_type": "kpi" | "revenue_chart" | "top_products" | "order_status" | "table",
    "items": ...,
    "summary": ...,
    "date_from": ...,
    "date_to": ...,
    "sql_query": ...,
}
```

Frontend sẽ render theo `widget_type`.

---

## Definition of Done (DoD)

- [ ] `run_stats_agent()` phân được `rest` và `text_to_sql`.
- [ ] Câu hỏi template cố định trả `meta.source = rest`.
- [ ] Câu hỏi tự do trả `meta.source = text_to_sql`.
- [ ] `stats_data.widget_type` luôn có mặt khi `response_type = stats`.
- [ ] Không gọi HTTP từ backend sang chính backend.

---

## Ghi chú

- Phase này không cần NLP classifier phức tạp; rule-based mapping là đủ.
- Giá trị lớn nhất của nhánh REST là dữ liệu có cấu trúc, dễ render widget hơn nhiều so với raw table.
