"""
admin_report.py — Text-to-SQL chain với agentic self-healing loop.

Flow:
  1. LLM sinh SQL từ câu hỏi + schema
  2. Validate (bảo mật)
  3. Thực thi SQL
  4. Nếu lỗi → feed error + SQL hỏng ngược lại LLM để tự sửa → retry
  5. Tối đa MAX_RETRIES lần, sau đó mới báo lỗi
  6. LLM tóm tắt kết quả thành câu trả lời tiếng Việt

Lý do thêm self-healing:
  - Query phức tạp (nhiều JOIN, subquery, GROUP BY) LLM thường sinh sai lần đầu
  - Schema thực tế có tên cột không trực quan (unit_price, change_amount...)
  - Với error message cụ thể từ MySQL, LLM sửa được >90% trường hợp
"""

from __future__ import annotations

import re
import logging
from datetime import date

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.services.ai_agent.llm import get_llm
from app.services.ai_agent.tools.text_to_sql import (
    DB_SCHEMA,
    validate_sql,
    execute_safe_sql,
)

logger = logging.getLogger(__name__)

MAX_RETRIES = 3  # Số lần tự sửa SQL tối đa

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

SQL_GEN_SYSTEM = f"""Bạn là chuyên gia SQL MySQL, làm việc với database cửa hàng đèn đá muối Himalaya.

{DB_SCHEMA}

== NHIỆM VỤ ==
Sinh DUY NHẤT một câu SELECT SQL hợp lệ. KHÔNG giải thích, KHÔNG markdown, KHÔNG comment.
Chỉ trả về câu SQL thuần túy, kết thúc bằng dấu chấm phẩy (;).

== QUY TẮC BẮT BUỘC ==
1. Chỉ dùng SELECT — tuyệt đối không INSERT/UPDATE/DELETE/DROP/ALTER
2. Luôn thêm LIMIT 200 nếu câu hỏi không chỉ định số lượng cụ thể
3. Dùng CURDATE() cho ngày hôm nay (KHÔNG hardcode ngày)
4. Khi tính doanh thu/lợi nhuận, CHỈ tính đơn status = 'delivered'
5. Tên cột phải đúng chính xác theo schema: unit_price (không phải price), change_amount (không phải change)
6. Khi JOIN nhiều bảng, luôn dùng alias rõ ràng (o, oi, p, c, u...)
"""

SQL_GEN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SQL_GEN_SYSTEM),
    ("human", "Câu hỏi: {question}"),
])

SQL_FIX_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SQL_GEN_SYSTEM),
    ("human", """Câu hỏi gốc: {question}

SQL vừa sinh bị lỗi:
```sql
{failed_sql}
```

Lỗi MySQL trả về:
{error_message}

Hãy phân tích lỗi và sinh lại một câu SQL MỚI đúng hơn.
Chỉ trả về SQL thuần túy, không giải thích."""),
])

SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Bạn là trợ lý phân tích kinh doanh cho cửa hàng đèn đá muối Himalaya.
Dựa trên câu hỏi và dữ liệu kết quả, viết câu trả lời ngắn gọn, rõ ràng bằng tiếng Việt.
- Format số tiền: 1,234,567đ
- Format ngày: DD/MM/YYYY
- Nếu dữ liệu nhiều, tóm tắt xu hướng chính, không liệt kê hết
- Giữ ngắn gọn, đúng trọng tâm"""),
    ("human", "Câu hỏi: {question}\n\nKết quả truy vấn:\n{sql_result}"),
])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _clean_sql(raw: str) -> str:
    """Loại bỏ markdown code block và normalize SQL."""
    # Xóa ```sql ... ``` hoặc ``` ... ```
    cleaned = re.sub(r"```(?:sql)?\s*", "", raw, flags=re.IGNORECASE)
    cleaned = cleaned.replace("```", "").strip()
    # Đảm bảo kết thúc bằng ;
    cleaned = cleaned.rstrip(";").strip() + ";"
    return cleaned


def _format_rows_for_summary(rows: list[dict], max_rows: int = 30) -> str:
    """Format rows thành text để LLM tóm tắt."""
    if not rows:
        return "Không có dữ liệu."

    lines = []
    for i, row in enumerate(rows[:max_rows]):
        parts = []
        for k, v in row.items():
            parts.append(f"{k}: {_fmt_value(v)}")
        lines.append(f"{i+1}. " + " | ".join(parts))

    result = "\n".join(lines)
    if len(rows) > max_rows:
        result += f"\n... (tổng {len(rows)} dòng, hiển thị {max_rows} dòng đầu)"
    return result


def _fmt_value(v) -> str:
    if v is None:
        return "N/A"
    if isinstance(v, float) and v > 10000:
        return f"{v:,.0f}đ"
    if isinstance(v, date):
        return v.strftime("%d/%m/%Y")
    return str(v)


# ---------------------------------------------------------------------------
# Main chain với self-healing loop
# ---------------------------------------------------------------------------
async def run_admin_report(question: str) -> dict:
    """Chạy Text-to-SQL chain với khả năng tự sửa lỗi.

    Returns:
        {
            "answer": str,          # Câu trả lời tiếng Việt
            "sql_query": str,       # SQL cuối cùng thực thi thành công
            "raw_data": list[dict], # Dữ liệu thô (tối đa 200 dòng)
            "error": str | None,    # None nếu thành công
            "attempts": int,        # Số lần thử (debug)
        }
    """
    llm = get_llm()
    sql_chain = SQL_GEN_PROMPT | llm | StrOutputParser()

    # ── Bước 1: Sinh SQL lần đầu ───────────────────────────────────────────
    raw_sql = await sql_chain.ainvoke({"question": question})
    current_sql = _clean_sql(raw_sql)
    logger.debug(f"[SQL gen attempt 1]\n{current_sql}")

    attempts = 1
    last_error: str | None = None

    # ── Bước 2: Validate + Execute + Self-healing loop ────────────────────
    for attempt in range(1, MAX_RETRIES + 2):  # +2 vì attempt 1 đã làm ở trên
        if attempt > 1:
            attempts = attempt

        # Validate bảo mật
        is_safe, security_error = validate_sql(current_sql)
        if not is_safe:
            # Lỗi security: không retry, báo ngay
            return {
                "answer": f"Không thể thực hiện yêu cầu này vì lý do bảo mật: {security_error}",
                "sql_query": current_sql,
                "raw_data": [],
                "error": security_error,
                "attempts": attempts,
            }

        # Thực thi
        rows, exec_error = await execute_safe_sql(current_sql)

        if not exec_error:
            # ✅ Thành công
            break

        # ❌ Lỗi thực thi
        last_error = exec_error
        logger.warning(f"[SQL attempt {attempt} failed] {exec_error}\nSQL: {current_sql}")

        if attempt >= MAX_RETRIES + 1:
            # Đã hết lần retry
            break

        # ── Self-healing: feed lỗi ngược lại LLM để sửa ──────────────────
        logger.info(f"[Self-healing] Attempt {attempt + 1}/{MAX_RETRIES + 1} — fixing SQL...")
        fix_chain = SQL_FIX_PROMPT | llm | StrOutputParser()
        fixed_raw = await fix_chain.ainvoke({
            "question": question,
            "failed_sql": current_sql,
            "error_message": exec_error,
        })
        current_sql = _clean_sql(fixed_raw)
        logger.debug(f"[SQL fixed attempt {attempt + 1}]\n{current_sql}")

    else:
        # Vòng lặp kết thúc mà không break (không xảy ra với logic trên nhưng để an toàn)
        rows, exec_error = [], last_error or "Unknown error"

    # ── Bước 3: Xử lý kết quả cuối cùng ──────────────────────────────────
    if last_error and not rows:
        # Vẫn lỗi sau tất cả retry
        friendly = _extract_friendly_error(last_error)
        return {
            "answer": (
                f"Xin lỗi, mình không thể truy vấn dữ liệu này sau {attempts} lần thử.\n"
                f"Lý do: {friendly}\n\n"
                f"Bạn có thể thử hỏi theo cách khác hoặc chia nhỏ câu hỏi không?"
            ),
            "sql_query": current_sql,
            "raw_data": [],
            "error": last_error,
            "attempts": attempts,
        }

    # ── Bước 4: LLM tóm tắt kết quả ──────────────────────────────────────
    sql_result_text = _format_rows_for_summary(rows)
    summary_chain = SUMMARY_PROMPT | llm | StrOutputParser()
    try:
        answer = await summary_chain.ainvoke({
            "question": question,
            "sql_result": sql_result_text,
        })
    except Exception as e:
        # Fallback nếu summary thất bại
        logger.error(f"Summary chain failed: {e}")
        answer = f"Truy vấn thành công. Kết quả có {len(rows)} dòng dữ liệu."

    return {
        "answer": answer,
        "sql_query": current_sql,
        "raw_data": rows[:200],
        "error": None,
        "attempts": attempts,
    }


def _extract_friendly_error(error: str) -> str:
    """Chuyển MySQL error message thành thông báo thân thiện hơn."""
    lower = error.lower()

    if "unknown column" in lower:
        # Extract tên cột từ lỗi
        match = re.search(r"unknown column '([^']+)'", lower)
        col = match.group(1) if match else "không xác định"
        return f"Tên cột không tồn tại: '{col}'. Database có thể dùng tên cột khác."

    if "table" in lower and "doesn't exist" in lower:
        match = re.search(r"table '([^']+)' doesn't exist", lower)
        tbl = match.group(1) if match else "không xác định"
        return f"Bảng '{tbl}' không tồn tại."

    if "syntax error" in lower or "you have an error in your sql" in lower:
        return "Cú pháp SQL không hợp lệ."

    if "ambiguous" in lower:
        return "Tên cột bị trùng giữa nhiều bảng, cần thêm alias."

    if "data too long" in lower:
        return "Dữ liệu vượt quá độ dài cho phép."

    # Generic fallback — truncate nếu quá dài
    return error[:200] if len(error) > 200 else error