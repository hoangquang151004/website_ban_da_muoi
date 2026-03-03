"""
test_ai_agent.py — Integration tests cho toàn bộ AI Agent.

Chạy: pytest backend/tests/test_ai_agent.py -v
(Yêu cầu: OPENAI_API_KEY trong .env, ChromaDB đã được seed, MySQL đang chạy)

Test cases:
- RAG: 5 câu hỏi kiến thức đèn đá muối
- Recommendation: 3 câu hỏi với filter giá khác nhau
- Ordering: Thêm sản phẩm qua chat
- Text-to-SQL: 5 câu hỏi báo cáo + 3 câu SQL độc hại bị block
"""

from __future__ import annotations

import pytest
import re
from unittest.mock import AsyncMock, MagicMock, patch

# ---------------------------------------------------------------------------
# Unit tests — không cần DB/LLM thực
# ---------------------------------------------------------------------------

class TestIntentDetection:
    """Test intent detection logic."""

    def test_order_intent_mua(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("Tôi muốn mua 2 cái đèn đá muối") == ChatIntent.ORDER

    def test_order_intent_them_gio(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("Thêm vào giỏ hàng giúp tôi") == ChatIntent.ORDER

    def test_recommend_intent_goi_y(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("Gợi ý cho tôi đèn phù hợp") == ChatIntent.RECOMMEND

    def test_recommend_intent_price(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("Đèn dưới 500k ngủ ngon") == ChatIntent.RECOMMEND

    def test_knowledge_intent_default(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("Đèn đá muối có tác dụng gì?") == ChatIntent.KNOWLEDGE

    def test_knowledge_intent_phong_thuy(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("Phong thủy đặt đèn ở đâu?") == ChatIntent.KNOWLEDGE


class TestSQLValidation:
    """Test SQL validation — bảo mật SQL injection."""

    def test_valid_select(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, _ = validate_sql("SELECT * FROM products;")
        assert is_safe is True

    def test_valid_complex_select(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        sql = """
        SELECT p.name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE MONTH(created_at) = 3
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 5;
        """
        is_safe, _ = validate_sql(sql)
        assert is_safe is True

    def test_block_insert(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, msg = validate_sql("INSERT INTO users (email) VALUES ('hacker@evil.com');")
        assert is_safe is False
        assert "INSERT" in msg.upper() or "SELECT" in msg.upper()

    def test_block_update(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, msg = validate_sql("UPDATE users SET role='admin' WHERE id=1;")
        assert is_safe is False

    def test_block_delete(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, msg = validate_sql("DELETE FROM orders;")
        assert is_safe is False

    def test_block_drop(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, msg = validate_sql("DROP TABLE users;")
        assert is_safe is False

    def test_block_alter(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, msg = validate_sql("ALTER TABLE users ADD COLUMN is_hacked BOOLEAN;")
        assert is_safe is False

    def test_block_truncate(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, msg = validate_sql("TRUNCATE TABLE orders;")
        assert is_safe is False

    def test_block_non_select(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, msg = validate_sql("SHOW TABLES;")
        assert is_safe is False

    def test_block_create(self):
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, msg = validate_sql("CREATE TABLE evil (id INT);")
        assert is_safe is False


class TestPriceExtraction:
    """Test price extraction from natural language."""

    def test_extract_max_price_k(self):
        from app.services.ai_agent.agent import _extract_max_price
        assert _extract_max_price("đèn dưới 500k") == 500_000.0

    def test_extract_max_price_tamgia(self):
        from app.services.ai_agent.agent import _extract_max_price
        assert _extract_max_price("tầm 300k") == 300_000.0

    def test_extract_no_price(self):
        from app.services.ai_agent.agent import _extract_max_price
        assert _extract_max_price("tôi muốn mua đèn ngủ") is None

    def test_extract_quantity_2(self):
        from app.services.ai_agent.agent import _extract_quantity
        assert _extract_quantity("mua 2 cái đèn đá muối") == 2

    def test_extract_quantity_default(self):
        from app.services.ai_agent.agent import _extract_quantity
        assert _extract_quantity("cho tôi mua đèn hổ phách") == 1


# ---------------------------------------------------------------------------
# Integration tests — cần LLM và DB
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
@pytest.mark.integration
class TestRAGChain:
    """RAG chain integration tests."""

    async def test_rag_cong_dung_den(self):
        """Hỏi về công dụng đèn → có câu trả lời có nguồn."""
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": "Đèn đá muối có tác dụng gì?"})
        assert "answer" in result
        assert len(result["answer"]) > 10
        assert "sources" in result

    async def test_rag_mat_ngu(self):
        """Hỏi về mất ngủ → trả lời có liên quan đến giấc ngủ."""
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": "Đèn đá muối có giúp ngủ ngon không?"})
        assert "answer" in result
        assert len(result["answer"]) > 10

    async def test_rag_phong_thuy(self):
        """Hỏi về phong thủy → trả lời về phong thủy."""
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": "Phong thủy đặt đèn đá muối ở đâu?"})
        assert "answer" in result

    async def test_rag_bao_quan(self):
        """Hỏi về cách bảo quản."""
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": "Cách bảo quản đèn đá muối như thế nào?"})
        assert "answer" in result

    async def test_rag_ngoai_chu_de(self):
        """Hỏi ngoài chủ đề → từ chối lịch sự."""
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": "Giá vàng hôm nay là bao nhiêu?"})
        assert "answer" in result
        # Phải từ chối hoặc nói không có thông tin
        answer_lower = result["answer"].lower()
        assert any(kw in answer_lower for kw in ["không", "chưa", "tôi", "thông tin"])


@pytest.mark.asyncio
@pytest.mark.integration
class TestRecommendationAgent:
    """Recommendation agent integration tests."""

    async def test_recommend_with_price_filter(self):
        """Tìm sản phẩm dưới 500k."""
        from app.services.ai_agent.agent import run_recommendation_agent
        result = await run_recommendation_agent("Tôi muốn mua đèn trị mất ngủ dưới 500k")
        assert "answer" in result
        assert "products" in result
        # Kiểm tra tất cả sản phẩm ≤ 500k
        for p in result["products"]:
            assert p["price"] <= 500_000, f"Sản phẩm {p['name']} có giá {p['price']} > 500k"

    async def test_recommend_general(self):
        """Tìm sản phẩm không filter."""
        from app.services.ai_agent.agent import run_recommendation_agent
        result = await run_recommendation_agent("Gợi ý đèn đá muối phù hợp cho phòng ngủ")
        assert "answer" in result
        assert isinstance(result["products"], list)

    async def test_recommend_high_budget(self):
        """Tìm sản phẩm với ngân sách cao."""
        from app.services.ai_agent.agent import run_recommendation_agent
        result = await run_recommendation_agent("Đèn cao cấp nhất dưới 2 triệu")
        assert "answer" in result


@pytest.mark.asyncio
@pytest.mark.integration
class TestOrderingAgent:
    """Conversational ordering integration tests."""

    async def test_ordering_no_auth(self):
        """Đặt hàng không có token → trả về yêu cầu đăng nhập."""
        from app.services.ai_agent.agent import run_chat
        result = await run_chat("Cho tôi mua 1 đèn đá muối", user_id=None)
        assert "đăng nhập" in result["answer"].lower()
        assert result.get("cart_updated") is False


@pytest.mark.asyncio
@pytest.mark.integration
class TestTextToSQL:
    """Text-to-SQL integration tests."""

    async def test_sql_doanh_thu_hom_nay(self):
        """Test câu hỏi doanh thu hôm nay."""
        from app.services.ai_agent.chains.admin_report import run_admin_report
        result = await run_admin_report("Doanh thu hôm nay?")
        assert "answer" in result
        assert "sql_query" in result
        assert result["sql_query"].lower().strip().startswith("select")

    async def test_sql_top_san_pham(self):
        """Test câu hỏi top sản phẩm bán chạy."""
        from app.services.ai_agent.chains.admin_report import run_admin_report
        result = await run_admin_report("Top 5 sản phẩm bán chạy tháng này?")
        assert "answer" in result
        assert "sql_query" in result

    async def test_sql_so_don_hang(self):
        """Test câu hỏi số đơn hàng."""
        from app.services.ai_agent.chains.admin_report import run_admin_report
        result = await run_admin_report("Có bao nhiêu đơn hàng trong tháng 3?")
        assert "answer" in result

    async def test_sql_doanh_thu_theo_thang(self):
        """Test câu hỏi doanh thu theo tháng."""
        from app.services.ai_agent.chains.admin_report import run_admin_report
        result = await run_admin_report("Doanh thu 3 tháng gần nhất?")
        assert "answer" in result

    async def test_sql_khach_hang_moi(self):
        """Test câu hỏi khách hàng mới."""
        from app.services.ai_agent.chains.admin_report import run_admin_report
        result = await run_admin_report("Có bao nhiêu khách hàng mới đăng ký tháng này?")
        assert "answer" in result

    async def test_sql_block_delete_via_question(self):
        """Test câu hỏi nguy hiểm qua ngôn ngữ tự nhiên."""
        from app.services.ai_agent.chains.admin_report import run_admin_report
        result = await run_admin_report("Xóa tất cả đơn hàng cũ")
        # Phải bị block hoặc chỉ sinh SELECT
        if "error" in result:
            assert True  # Bị block — đúng
        else:
            sql = result.get("sql_query", "").lower()
            assert sql.startswith("select"), "SQL nguy hiểm không bị lọc!"

    async def test_sql_block_drop_table(self):
        """Test phát hiện DROP TABLE trong SQL được sinh."""
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, _ = validate_sql("DROP TABLE users CASCADE;")
        assert is_safe is False

    async def test_sql_block_update_price(self):
        """Test phát hiện UPDATE giá sản phẩm."""
        from app.services.ai_agent.tools.text_to_sql import validate_sql
        is_safe, _ = validate_sql("UPDATE products SET price=0 WHERE id<100;")
        assert is_safe is False
