# Task 03 — Backend: Test cho luồng thống kê admin trong chat

**Giai đoạn:** 5 - Thống kê admin  
**Ưu tiên:** 🟠 P1  
**Ước lượng:** 1–2 giờ  
**File chính:** `backend/tests/test_ai_agent.py`

---

## Bối cảnh

Thống kê admin là luồng nhạy cảm vì có liên quan đến phân quyền và dữ liệu kinh doanh. Cần test ít nhất 4 nhóm hành vi:

- intent detection
- role guard
- routing `rest` vs `text_to_sql`
- response shape `stats`

---

## Công việc cần làm

### Bước 1 — Test intent detection cho `STATS`

Thêm test:

```python
def test_stats_intent_doanh_thu(self):
    from app.services.ai_agent.agent import detect_intent, ChatIntent
    assert detect_intent("doanh thu tháng này") == ChatIntent.STATS


def test_stats_intent_top_products(self):
    from app.services.ai_agent.agent import detect_intent, ChatIntent
    assert detect_intent("top sản phẩm bán chạy") == ChatIntent.STATS
```

### Bước 2 — Test role guard trong `run_chat()`

```python
@pytest.mark.asyncio
async def test_run_chat_stats_requires_admin():
    from app.services.ai_agent.agent import run_chat
    result = await run_chat("doanh thu tháng này", user_id=1, user_role="customer")
    assert result["response_type"] == "text"
    assert "quản trị" in result["answer"].lower() or "admin" in result["answer"].lower()
```

### Bước 3 — Test nhánh admin thành công

Mock `run_stats_agent`:

```python
@pytest.mark.asyncio
async def test_run_chat_stats_admin_success():
    from app.services.ai_agent.agent import run_chat
    with patch("app.services.ai_agent.agent.run_stats_agent", new=AsyncMock(return_value={
        "answer": "Đây là doanh thu tháng này.",
        "stats_data": {"widget_type": "kpi", "items": []},
        "meta": {"source": "rest"},
    })):
        result = await run_chat("doanh thu tháng này", user_id=1, user_role="admin")
        assert result["intent"] == "stats"
        assert result["response_type"] == "stats"
        assert result["meta"]["source"] == "rest"
```

### Bước 4 — Test `run_stats_agent()` hybrid routing

Mock `run_admin_report()` cho nhánh `text_to_sql`, và mock service stats cho nhánh `rest`.

Ít nhất cần xác nhận:

- template question → `meta.source = rest`
- free-form question → `meta.source = text_to_sql`

---

## Definition of Done (DoD)

- [ ] Có test cho intent `STATS`.
- [ ] Có test chặn non-admin.
- [ ] Có test thành công cho admin.
- [ ] Có test phân luồng `rest` vs `text_to_sql`.
- [ ] Không làm fail các test cũ của AI agent.

---

## Ghi chú

- Ưu tiên mock để test nhanh; không cần DB thật ở level này.
- Với nhánh `text_to_sql`, chỉ cần assert `meta.source` và `widget_type = table` là đủ.
