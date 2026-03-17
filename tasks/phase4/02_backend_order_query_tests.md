# Task 02 — Backend: Thêm test cho luồng order query trong chat

**Giai đoạn:** 4 - Quản lý đơn hàng  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 1–2 giờ  
**File chính:** `backend/tests/test_ai_agent.py`

---

## Bối cảnh

Sau khi thêm `ORDER_QUERY`, cần khóa hành vi bằng test để tránh regression ở intent detection và response shape.

---

## Công việc cần làm

### Bước 1 — Thêm unit test cho intent detection

Thêm vào `TestIntentDetection`:

```python
def test_order_query_intent_my_orders(self):
    from app.services.ai_agent.agent import detect_intent, ChatIntent
    assert detect_intent("xem đơn hàng của tôi") == ChatIntent.ORDER_QUERY


def test_order_query_intent_order_id(self):
    from app.services.ai_agent.agent import detect_intent, ChatIntent
    assert detect_intent("chi tiết đơn #42") == ChatIntent.ORDER_QUERY
```

### Bước 2 — Thêm unit test cho `_extract_order_id()`

```python
def test_extract_order_id_hash(self):
    from app.services.ai_agent.agent import _extract_order_id
    assert _extract_order_id("đơn #42 đang ở đâu") == 42


def test_extract_order_id_none(self):
    from app.services.ai_agent.agent import _extract_order_id
    assert _extract_order_id("xem đơn hàng của tôi") is None
```

### Bước 3 — Thêm test async cho `run_chat()` nhánh order query

Dùng `patch` mock `run_order_query_agent`:

```python
@pytest.mark.asyncio
async def test_run_chat_order_query_list():
    from app.services.ai_agent.agent import run_chat

    with patch("app.services.ai_agent.agent.run_order_query_agent", new=AsyncMock(return_value={
        "answer": "Đây là các đơn hàng gần nhất của bạn.",
        "orders": [{"id": 1, "status": "pending", "total_amount": 500000, "created_at": "2026-03-01"}],
        "order_detail": None,
    })):
        result = await run_chat("xem đơn hàng của tôi", user_id=1)
        assert result["intent"] == "order_query"
        assert result["response_type"] == "order_list"
        assert isinstance(result["orders"], list)
```

Thêm case detail:

```python
@pytest.mark.asyncio
async def test_run_chat_order_query_detail():
    from app.services.ai_agent.agent import run_chat

    with patch("app.services.ai_agent.agent.run_order_query_agent", new=AsyncMock(return_value={
        "answer": "Đây là chi tiết đơn hàng #42.",
        "orders": None,
        "order_detail": {"id": 42, "status": "shipping", "items": []},
    })):
        result = await run_chat("chi tiết đơn #42", user_id=1)
        assert result["intent"] == "order_query"
        assert result["response_type"] == "order_detail"
        assert result["order_detail"]["id"] == 42
```

### Bước 4 — Test unauthenticated case

```python
@pytest.mark.asyncio
async def test_run_chat_order_query_requires_login():
    from app.services.ai_agent.agent import run_chat
    result = await run_chat("xem đơn hàng của tôi", user_id=None)
    assert result["response_type"] == "text"
    assert "đăng nhập" in result["answer"].lower()
```

---

## Definition of Done (DoD)

- [ ] Có test cho intent `ORDER_QUERY`.
- [ ] Có test cho parse `order_id`.
- [ ] Có test cho 3 case: list, detail, unauthenticated.
- [ ] `pytest backend/tests/test_ai_agent.py -v` không fail vì thay đổi mới.

---

## Ghi chú

- Ưu tiên mock ở layer `agent.py`, không cần dựng DB thật cho phase này.
- Test shape response quan trọng hơn wording chính xác của answer.
