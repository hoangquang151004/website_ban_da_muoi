"""
text_to_sql.py — LangChain Tool sinh và thực thi câu SQL SELECT an toàn.
"""

from __future__ import annotations

import re

from langchain_core.tools import tool

# ---------------------------------------------------------------------------
# Danh sách từ khóa nguy hiểm
# ---------------------------------------------------------------------------
DANGEROUS_KEYWORDS = frozenset([
    "insert", "update", "delete", "drop", "alter", "truncate",
    "create", "replace", "grant", "revoke", "exec", "execute",
    "call", "merge", "load", "into outfile", "dumpfile",
])

DB_SCHEMA = """
Các bảng trong database:

users (id, full_name, email, phone, address, role[customer/admin], is_active, created_at, updated_at)
categories (id, name, slug, description, is_active, created_at)
uses (id, name, icon, color, description, is_active, created_at)
products (id, name, slug, description, price, original_price, stock, image_url, is_featured, is_active, category_id, created_at, updated_at)
product_uses (product_id, use_id)  -- bảng trung gian Many-to-Many
orders (id, user_id, receiver_name, receiver_phone, receiver_address, note, payment_method[cod/bank_transfer], status[pending/confirmed/packing/shipping/delivered/cancelled], total_amount, created_at, updated_at)
order_items (id, order_id, product_id, quantity, price)
reviews (id, product_id, user_id, rating[1-5], comment, is_approved, created_at)
stock_logs (id, product_id, change, reason, note, created_at)

Quan hệ:
- products.category_id → categories.id
- product_uses.product_id → products.id, product_uses.use_id → uses.id
- orders.user_id → users.id
- order_items.order_id → orders.id, order_items.product_id → products.id
- reviews.product_id → products.id, reviews.user_id → users.id
- stock_logs.product_id → products.id
"""


def validate_sql(sql: str) -> tuple[bool, str]:
    """Kiểm tra câu SQL có an toàn không.

    Returns:
        (is_safe: bool, error_message: str)
    """
    sql_lower = sql.lower().strip()

    # Phải bắt đầu bằng SELECT
    if not sql_lower.startswith("select"):
        return False, "Chỉ cho phép câu truy vấn SELECT."

    # Kiểm tra từ khóa nguy hiểm
    for keyword in DANGEROUS_KEYWORDS:
        # Dùng word boundary để tránh false positive
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, sql_lower):
            return False, f"Câu SQL chứa từ khóa không được phép: '{keyword.upper()}'."

    # Không cho phép subquery với DML
    if re.search(r'\b(insert|update|delete)\b', sql_lower):
        return False, "Từ khóa DML không được phép trong câu truy vấn."

    # Không cho phép nhiều câu SQL
    if sql.count(";") > 1 or (sql.count(";") == 1 and not sql.strip().endswith(";")):
        return False, "Chỉ cho phép một câu SQL duy nhất."

    return True, ""


async def execute_safe_sql(sql: str) -> tuple[list[dict], str]:
    """Thực thi câu SQL SELECT và trả về kết quả.

    Returns:
        (rows: list[dict], error: str)
    """
    import sqlalchemy
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text
    from app.core.config import settings

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    rows = []
    error = ""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(sql))
            columns = list(result.keys())
            for row in result.fetchall():
                rows.append(dict(zip(columns, row)))
    except sqlalchemy.exc.SQLAlchemyError as e:
        error = f"Lỗi thực thi SQL: {str(e)}"
    finally:
        await engine.dispose()
    return rows, error


@tool
async def text_to_sql_tool(question: str) -> str:
    """Sinh câu SQL từ câu hỏi ngôn ngữ tự nhiên và thực thi để trả lời.

    Chỉ sinh câu SELECT, từ chối mọi câu SQL nguy hiểm.

    Args:
        question: Câu hỏi về dữ liệu kinh doanh (VD: "Doanh thu hôm nay?")

    Returns:
        Kết quả truy vấn dạng text
    """
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from app.services.ai_agent.llm import get_llm

    # Sinh SQL
    sql_prompt = ChatPromptTemplate.from_messages([
        ("system", f"""Bạn là chuyên gia SQL MySQL.
Dựa trên schema sau, hãy sinh **duy nhất một câu SELECT SQL** (không giải thích, không markdown, chỉ SQL thuần).
Câu SQL phải an toàn, chỉ đọc dữ liệu.

Schema:
{DB_SCHEMA}

Ngày hiện tại: 2026-03-03
"""),
        ("human", "{question}"),
    ])

    llm = get_llm()
    sql_chain = sql_prompt | llm | StrOutputParser()
    raw_sql = await sql_chain.ainvoke({"question": question})

    # Clean up markdown code blocks nếu có
    cleaned_sql = re.sub(r"```(?:sql)?\s*", "", raw_sql, flags=re.IGNORECASE).strip()
    cleaned_sql = cleaned_sql.rstrip(";").strip() + ";"

    # Validate
    is_safe, error_msg = validate_sql(cleaned_sql)
    if not is_safe:
        return f"🚫 Không thể thực thi: {error_msg}"

    # Thực thi
    rows, exec_error = await execute_safe_sql(cleaned_sql)
    if exec_error:
        return f"Lỗi: {exec_error}\nSQL đã sinh: {cleaned_sql}"

    if not rows:
        return f"Truy vấn thực thi thành công nhưng không có kết quả.\nSQL: {cleaned_sql}"

    # Format kết quả
    lines = []
    for i, row in enumerate(rows[:20]):  # Giới hạn 20 dòng
        line = " | ".join(f"{k}: {v}" for k, v in row.items())
        lines.append(f"{i+1}. {line}")

    return f"Kết quả ({len(rows)} dòng):\n" + "\n".join(lines)
