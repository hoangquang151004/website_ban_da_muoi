"""
text_to_sql.py — Tool sinh và thực thi SQL SELECT an toàn.

Schema được đồng bộ chính xác với da_muoi_db (kiểm tra 2026-03).
"""

from __future__ import annotations

import re
from langchain_core.tools import tool

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
DANGEROUS_KEYWORDS = frozenset([
    "insert", "update", "delete", "drop", "alter", "truncate",
    "create", "replace", "grant", "revoke", "exec", "execute",
    "call", "merge", "load", "into outfile", "dumpfile",
])

# ---------------------------------------------------------------------------
# DB_SCHEMA — đồng bộ thực tế với da_muoi_db
# Quan trọng: LLM dùng schema này để sinh SQL đúng cột
# ---------------------------------------------------------------------------
DB_SCHEMA = """
== SCHEMA DATABASE (MySQL) ==

-- users
users (
  id INT PK,
  full_name VARCHAR,
  email VARCHAR UNIQUE,
  phone VARCHAR,
  address VARCHAR,
  ward VARCHAR,
  district VARCHAR,
  city VARCHAR,
  postal_code VARCHAR,
  address_note VARCHAR,
  role ENUM('customer','admin') DEFAULT 'customer',
  is_active TINYINT(1) DEFAULT 1,
  date_of_birth DATE,
  gender VARCHAR,
  avatar_url VARCHAR,
  created_at DATETIME,
  updated_at DATETIME
)

-- categories
categories (
  id INT PK,
  name VARCHAR UNIQUE,
  slug VARCHAR UNIQUE,
  description TEXT,
  image_url VARCHAR,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME
)

-- uses  [công dụng sản phẩm]
uses (
  id INT PK,
  name VARCHAR UNIQUE,
  icon VARCHAR,
  color VARCHAR,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME
)

-- products
products (
  id INT PK,
  name VARCHAR,
  slug VARCHAR UNIQUE,
  description TEXT,
  price DECIMAL(10,2),           -- giá bán
  original_price DECIMAL(10,2),  -- giá gốc (trước giảm)
  cost_price DECIMAL(10,2),      -- giá vốn (để tính lợi nhuận)
  stock INT DEFAULT 0,
  min_stock INT,                 -- ngưỡng cảnh báo tồn kho thấp
  image_url VARCHAR,
  model_3d_url VARCHAR,
  is_featured TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  category_id INT FK→categories.id,
  created_at DATETIME,
  updated_at DATETIME
)

-- product_uses  [Many-to-Many: sản phẩm ↔ công dụng]
product_uses (
  product_id INT FK→products.id,
  use_id INT FK→uses.id,
  PRIMARY KEY (product_id, use_id)
)

-- orders
orders (
  id INT PK,
  user_id INT FK→users.id (NULL nếu guest),
  receiver_name VARCHAR,
  receiver_phone VARCHAR,
  receiver_address VARCHAR,
  note TEXT,
  payment_method ENUM('cod','bank_transfer'),
  status ENUM('pending','confirmed','packing','shipping','delivered','cancelled') DEFAULT 'pending',
  total_amount DECIMAL(12,2),
  created_at DATETIME,
  updated_at DATETIME
)

-- order_items
order_items (
  id INT PK,
  order_id INT FK→orders.id,
  product_id INT FK→products.id,
  quantity INT,
  unit_price DECIMAL(10,2),   -- KHÔNG phải 'price', là 'unit_price'
  subtotal DECIMAL(12,2)      -- = quantity * unit_price
)

-- reviews
reviews (
  id INT PK,
  product_id INT FK→products.id,
  user_id INT FK→users.id,
  rating INT (1-5),
  comment TEXT,
  admin_reply TEXT,
  is_approved TINYINT(1) DEFAULT 0,
  created_at DATETIME
)

-- stock_logs  [lịch sử nhập/xuất kho]
stock_logs (
  id INT PK,
  product_id INT FK→products.id,
  change_amount INT,           -- KHÔNG phải 'change', là 'change_amount' (+nhập / -xuất)
  reason ENUM('purchase','restock','adjustment'),
  reference_id INT,            -- order_id hoặc NULL
  unit_cost DECIMAL(10,2),
  note VARCHAR,
  created_at DATETIME
)

== CÁC GIÁ TRỊ ENUM QUAN TRỌNG ==
orders.status: 'pending'=chờ xác nhận, 'confirmed'=đã xác nhận,
               'packing'=đang đóng gói, 'shipping'=đang giao,
               'delivered'=giao thành công, 'cancelled'=đã hủy
orders.payment_method: 'cod'=tiền mặt khi nhận, 'bank_transfer'=chuyển khoản
stock_logs.reason: 'purchase'=bán hàng, 'restock'=nhập kho, 'adjustment'=điều chỉnh
users.role: 'customer', 'admin'

== CÁC CÔNG THỨC THƯỜNG DÙNG ==
-- Doanh thu (chỉ đơn delivered):
  SUM(total_amount) FROM orders WHERE status = 'delivered'

-- Lợi nhuận gộp (cần JOIN order_items + products):
  SUM(oi.quantity * (oi.unit_price - p.cost_price))
  FROM order_items oi JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id WHERE o.status = 'delivered'

-- Sản phẩm tồn kho thấp:
  SELECT * FROM products WHERE stock <= min_stock AND is_active = 1

-- Ngày hôm nay: CURDATE()
-- Tháng này: YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
-- 30 ngày gần nhất: created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
"""


def validate_sql(sql: str) -> tuple[bool, str]:
    """Kiểm tra câu SQL có an toàn không."""
    sql_lower = sql.lower().strip()

    if not sql_lower.startswith("select"):
        return False, "Chỉ cho phép câu truy vấn SELECT."

    for keyword in DANGEROUS_KEYWORDS:
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, sql_lower):
            return False, f"Câu SQL chứa từ khóa không được phép: '{keyword.upper()}'."

    # Không cho phép nhiều câu SQL
    clean = sql.strip().rstrip(";")
    if ";" in clean:
        return False, "Chỉ cho phép một câu SQL duy nhất."

    return True, ""


async def execute_safe_sql(sql: str) -> tuple[list[dict], str]:
    """Thực thi SQL SELECT, trả về (rows, error_message)."""
    import sqlalchemy
    from sqlalchemy import text
    from app.db.session import AsyncSessionLocal

    rows: list[dict] = []
    error = ""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text(sql))
            columns = list(result.keys())
            for row in result.fetchall():
                rows.append(dict(zip(columns, row)))
    except sqlalchemy.exc.SQLAlchemyError as e:
        error = str(e)
    except Exception as e:
        error = f"Unexpected error: {str(e)}"
    return rows, error


@tool
async def text_to_sql_tool(question: str) -> str:
    """Sinh câu SQL từ câu hỏi ngôn ngữ tự nhiên và thực thi để trả lời.

    Chỉ sinh câu SELECT, từ chối mọi câu SQL nguy hiểm.
    """
    from app.services.ai_agent.chains.admin_report import run_admin_report
    result = await run_admin_report(question)
    return result.get("answer", "Không có kết quả.")