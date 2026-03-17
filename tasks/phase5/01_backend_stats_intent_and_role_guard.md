# Task 01 — Backend: Thêm `STATS` intent vào chat unified và kiểm tra quyền admin

**Giai đoạn:** 5 - Thống kê admin  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 1–2 giờ  
**File chính:** `backend/app/routers/chat.py`, `backend/app/services/ai_agent/agent.py`

---

## Bối cảnh

Backend đã có:

- REST stats endpoints tại `/api/v1/admin/statistics/*`
- Text-to-SQL tại `/api/v1/admin/chat/report`

Nhưng `POST /api/v1/chat` hiện chỉ truyền `user_id` vào `run_chat()`, chưa đủ thông tin để:

- xác định user có phải admin hay không
- route intent `STATS` một cách an toàn

Task này đưa `STATS` vào luồng chat unified với role guard rõ ràng.

---

## Công việc cần làm

### Bước 1 — Mở rộng `run_chat()` nhận thêm role/context

Hiện tại `chat.py` gọi:

```python
result = await run_chat(
    message=req.message,
    user_id=user_id,
    session_id=req.session_id,
)
```

Cần đổi thành truyền thêm role:

```python
user_role = current_user.role if current_user else None

result = await run_chat(
    message=req.message,
    user_id=user_id,
    user_role=user_role,
    session_id=req.session_id,
)
```

Trong `agent.py`, cập nhật signature:

```python
async def run_chat(
    message: str,
    user_id: Optional[int] = None,
    user_role: Optional[str] = None,
    session_id: Optional[str] = None,
) -> dict:
```

### Bước 2 — Xử lý nhánh `ChatIntent.STATS`

Trong `run_chat()`:

```python
elif intent == ChatIntent.STATS:
    if user_role != "admin":
        return {
            "answer": "Chức năng thống kê chỉ dành cho quản trị viên.",
            "response_type": "text",
            "intent": intent.value,
            "stats_data": None,
        }

    result = await run_stats_agent(message)
    result["intent"] = intent.value
    result["response_type"] = "stats"
    return result
```

### Bước 3 — Tạo stub `run_stats_agent()`

Phase 5 sẽ hoàn thiện logic bên trong ở Task 02. Ở task này chỉ cần tạo function stub với contract chuẩn:

```python
async def run_stats_agent(message: str) -> dict:
    return {
        "answer": "Đây là dữ liệu thống kê bạn yêu cầu.",
        "stats_data": {},
        "meta": {"source": "rest"},
    }
```

### Bước 4 — Đảm bảo contract `stats_data`

Khi `response_type = "stats"`, response nên có tối thiểu:

- `answer`
- `response_type = "stats"`
- `intent = "stats"`
- `stats_data`
- `meta.source = "rest" | "text_to_sql"`

---

## Definition of Done (DoD)

- [ ] `run_chat()` nhận thêm `user_role`.
- [ ] Non-admin hỏi thống kê → bot từ chối bằng `response_type = text`.
- [ ] Admin hỏi thống kê → bot trả `response_type = stats`.
- [ ] Không ảnh hưởng các intent cũ (`ORDER`, `RECOMMEND`, `KNOWLEDGE`, `ORDER_QUERY`).

---

## Ghi chú

- Không dùng `require_admin` trong unified chat router vì route này vẫn phục vụ guest/user. Phân quyền phải nằm trong nhánh `STATS`.
- `meta.source` sẽ giúp frontend biết dữ liệu đi từ REST hay Text-to-SQL để render phù hợp.
