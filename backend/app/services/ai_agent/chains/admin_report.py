"""
admin_report.py — Chain Text-to-SQL cho Admin báo cáo kinh doanh.

Logic:
1. Nhận câu hỏi ngôn ngữ tự nhiên từ Admin
2. LLM sinh câu SELECT SQL dựa trên schema DB
3. Validate SQL (từ chối DML, DDL)
4. Thực thi SQL
5. LLM tóm tắt kết quả thành câu trả lời tự nhiên
"""

from __future__ import annotations

import re

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

from app.services.ai_agent.llm import get_llm
from app.services.ai_agent.tools.text_to_sql import (
    DB_SCHEMA,
    validate_sql,
    execute_safe_sql,
)

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
SQL_GEN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", f"""Bạn là chuyên gia SQL MySQL làm việc với database cửa hàng đèn đá muối Himalaya.
Nhiệm vụ: Sinh **duy nhất một câu SELECT SQL** không có giải thích, không có markdown.
Chỉ trả về câu SQL thuần túy.

Schema database:
{DB_SCHEMA}

Quy tắc:
- Chỉ dùng SELECT, tuyệt đối không INSERT/UPDATE/DELETE/DROP
- LIMIT 100 cho các truy vấn không có LIMIT
- Dùng CURDATE() cho ngày hôm nay, DATE_FORMAT cho format ngày tháng
- Trong bảng orders, trạng thái giao hàng thành công là status = 'delivered'

Ngày hiện tại: 2026-03-03
"""),
    ("human", "{question}"),
])

SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Bạn là trợ lý phân tích kinh doanh cho cửa hàng đèn đá muối Himalaya.
Dựa trên câu hỏi và kết quả dữ liệu, hãy viết câu trả lời ngắn gọn, rõ ràng bằng tiếng Việt.
Trình bày số liệu dễ đọc (định dạng tiền tệ, ngày tháng, v.v.)"""),
    ("human", "Câu hỏi: {question}\n\nKết quả SQL:\n{sql_result}"),
])


# ---------------------------------------------------------------------------
# Chain
# ---------------------------------------------------------------------------
async def run_admin_report(question: str) -> dict:
    """Chạy Text-to-SQL chain và trả về kết quả đầy đủ.

    Returns:
        dict với keys: answer, sql_query, raw_data, error (nếu có)
    """
    llm = get_llm()

    # 1. Sinh SQL
    sql_chain = SQL_GEN_PROMPT | llm | StrOutputParser()
    raw_sql = await sql_chain.ainvoke({"question": question})

    # Clean up
    cleaned_sql = re.sub(r"```(?:sql)?\s*", "", raw_sql, flags=re.IGNORECASE).strip()
    cleaned_sql = cleaned_sql.rstrip(";").strip() + ";"

    # 2. Validate
    is_safe, error_msg = validate_sql(cleaned_sql)
    if not is_safe:
        return {
            "answer": f"Không thể xử lý yêu cầu này vì lý do bảo mật: {error_msg}",
            "sql_query": cleaned_sql,
            "raw_data": [],
            "error": error_msg,
        }

    # 3. Thực thi SQL
    rows, exec_error = await execute_safe_sql(cleaned_sql)
    if exec_error:
        return {
            "answer": f"Lỗi khi truy vấn dữ liệu: {exec_error}",
            "sql_query": cleaned_sql,
            "raw_data": [],
            "error": exec_error,
        }

    # 4. Tóm tắt kết quả
    if not rows:
        sql_result_text = "Không có dữ liệu."
    else:
        lines = []
        for i, row in enumerate(rows[:20]):
            line = " | ".join(
                f"{k}: {_format_value(v)}" for k, v in row.items()
            )
            lines.append(f"{i+1}. {line}")
        sql_result_text = "\n".join(lines)
        if len(rows) > 20:
            sql_result_text += f"\n... (và {len(rows) - 20} dòng khác)"

    summary_chain = SUMMARY_PROMPT | llm | StrOutputParser()
    answer = await summary_chain.ainvoke({
        "question": question,
        "sql_result": sql_result_text,
    })

    return {
        "answer": answer,
        "sql_query": cleaned_sql,
        "raw_data": rows[:100],  # Giới hạn 100 dòng raw data
    }


def _format_value(v) -> str:
    """Format giá trị để hiển thị đẹp hơn."""
    if v is None:
        return "N/A"
    if isinstance(v, float) and v > 1000:
        return f"{v:,.0f}đ"
    return str(v)
