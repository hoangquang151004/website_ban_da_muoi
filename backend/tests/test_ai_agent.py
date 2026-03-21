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
from types import SimpleNamespace

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

    def test_order_intent_them_san_pham_vao_gio_hang(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("Thêm sản phẩm test 1 vào giỏ hàng") == ChatIntent.ORDER

    def test_order_intent_xoa_san_pham_khoi_gio_hang(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("Xóa Đá muối hình bình khỏi giỏ hàng") == ChatIntent.ORDER

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

    def test_order_query_intent_my_orders(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("xem đơn hàng của tôi") == ChatIntent.ORDER_QUERY

    def test_order_query_intent_order_id(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("chi tiết đơn #42") == ChatIntent.ORDER_QUERY

    def test_stats_intent(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("doanh thu tháng này") == ChatIntent.STATS

    def test_stats_intent_top_products(self):
        from app.services.ai_agent.agent import detect_intent, ChatIntent
        assert detect_intent("top sản phẩm bán chạy") == ChatIntent.STATS


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


class TestOrderIdExtraction:
    def test_extract_order_id_hash(self):
        from app.services.ai_agent.agent import _extract_order_id
        assert _extract_order_id("đơn #42 đang ở đâu") == 42

    def test_extract_order_id_none(self):
        from app.services.ai_agent.agent import _extract_order_id
        assert _extract_order_id("xem đơn hàng của tôi") is None


class _FakeSessionContext:
    async def __aenter__(self):
        return object()

    async def __aexit__(self, exc_type, exc, tb):
        return False


@pytest.mark.asyncio
class TestOrderQueryAgent:
    async def test_run_order_query_list_recent(self):
        from app.services.ai_agent.agent import run_order_query_agent

        order1 = SimpleNamespace(
            id=1,
            status=SimpleNamespace(value="pending"),
            total_amount=199000,
            created_at=None,
            items=[SimpleNamespace(product=SimpleNamespace(name="Đèn A", image_url="img-a"))],
        )

        with patch("app.db.session.AsyncSessionLocal", new=lambda: _FakeSessionContext()):
            with patch("app.services.crud.order.list_user_orders", new=AsyncMock(return_value={"items": [order1]})):
                result = await run_order_query_agent("đơn hàng của tôi", user_id=10)

        assert result["order_detail"] is None
        assert isinstance(result["orders"], list)
        assert result["orders"][0]["id"] == 1
        assert result["orders"][0]["first_item_name"] == "Đèn A"

    async def test_run_order_query_detail_success(self):
        from app.services.ai_agent.agent import run_order_query_agent

        item = SimpleNamespace(
            quantity=2,
            unit_price=250000,
            subtotal=500000,
            product=SimpleNamespace(name="Đèn B", image_url="img-b", slug="den-b"),
        )
        order = SimpleNamespace(
            id=42,
            user_id=7,
            receiver_name="Nguyen Van A",
            receiver_phone="0900000000",
            receiver_address="HCM",
            note="giao giờ hành chính",
            payment_method=SimpleNamespace(value="cod"),
            status=SimpleNamespace(value="shipping"),
            total_amount=500000,
            created_at=None,
            items=[item],
        )

        with patch("app.db.session.AsyncSessionLocal", new=lambda: _FakeSessionContext()):
            with patch("app.services.crud.order.get_order_by_id", new=AsyncMock(return_value=order)):
                result = await run_order_query_agent("chi tiết đơn 42", user_id=7)

        assert result["orders"] is None
        assert result["order_detail"]["id"] == 42
        assert result["order_detail"]["items"][0]["product_slug"] == "den-b"

    async def test_run_order_query_detail_forbidden(self):
        from app.services.ai_agent.agent import run_order_query_agent

        order = SimpleNamespace(id=42, user_id=99)
        with patch("app.db.session.AsyncSessionLocal", new=lambda: _FakeSessionContext()):
            with patch("app.services.crud.order.get_order_by_id", new=AsyncMock(return_value=order)):
                result = await run_order_query_agent("đơn #42", user_id=7)

        assert "không có quyền" in result["answer"].lower()
        assert result["order_detail"] is None

    async def test_run_chat_order_query_requires_login(self):
        from app.services.ai_agent.agent import run_chat

        result = await run_chat("xem đơn hàng của tôi", user_id=None)

        assert result["response_type"] == "text"
        assert result["intent"] == "order_query"
        assert "đăng nhập" in result["answer"].lower()

    async def test_run_chat_order_query_maps_response_type(self):
        from app.services.ai_agent.agent import run_chat

        mocked_result = {
            "answer": "Đây là chi tiết đơn hàng #42.",
            "orders": None,
            "order_detail": {"id": 42},
        }

        with patch("app.services.ai_agent.agent.run_order_query_agent", new=AsyncMock(return_value=mocked_result)):
            result = await run_chat("đơn #42", user_id=7)

        assert result["intent"] == "order_query"
        assert result["response_type"] == "order_detail"
        assert result["order_detail"]["id"] == 42

    async def test_run_chat_order_query_list(self):
        from app.services.ai_agent.agent import run_chat

        mocked_result = {
            "answer": "Đây là các đơn hàng gần nhất của bạn.",
            "orders": [
                {
                    "id": 1,
                    "status": "pending",
                    "total_amount": 500000,
                    "created_at": "2026-03-01",
                }
            ],
            "order_detail": None,
        }

        with patch("app.services.ai_agent.agent.run_order_query_agent", new=AsyncMock(return_value=mocked_result)):
            result = await run_chat("xem đơn hàng của tôi", user_id=1)

        assert result["intent"] == "order_query"
        assert result["response_type"] == "order_list"
        assert isinstance(result["orders"], list)


@pytest.mark.asyncio
class TestStatsChatGuard:
    async def test_run_chat_stats_requires_admin(self):
        from app.services.ai_agent.agent import run_chat

        result = await run_chat("doanh thu tháng này", user_id=1, user_role="customer")

        assert result["response_type"] == "text"
        assert result["intent"] == "stats"
        assert "quản trị" in result["answer"].lower() or "admin" in result["answer"].lower()

    async def test_run_chat_stats_admin_success(self):
        from app.services.ai_agent.agent import run_chat

        mocked_stats_result = {
            "answer": "Đây là doanh thu tháng này.",
            "stats_data": {"widget_type": "kpi", "items": []},
            "meta": {"source": "rest"},
        }

        with patch("app.services.ai_agent.agent.run_stats_agent", new=AsyncMock(return_value=mocked_stats_result)):
            result = await run_chat("doanh thu tháng này", user_id=1, user_role="admin")

        assert result["intent"] == "stats"
        assert result["response_type"] == "stats"
        assert result["meta"]["source"] == "rest"
        assert result["stats_data"]["widget_type"] == "kpi"

    async def test_run_chat_stats_admin_enum_role_success(self):
        from app.models.user import UserRole
        from app.services.ai_agent.agent import run_chat

        mocked_stats_result = {
            "answer": "Đây là doanh thu tháng này.",
            "stats_data": {"widget_type": "kpi", "items": []},
            "meta": {"source": "rest"},
        }

        with patch("app.services.ai_agent.agent.run_stats_agent", new=AsyncMock(return_value=mocked_stats_result)):
            result = await run_chat("doanh thu tháng này", user_id=1, user_role=UserRole.admin)

        assert result["intent"] == "stats"
        assert result["response_type"] == "stats"

    async def test_run_chat_admin_analytics_query_routes_to_stats_not_rag(self):
        from app.models.user import UserRole
        from app.services.ai_agent.agent import run_chat

        mocked_stats_result = {
            "answer": "Báo cáo theo danh mục.",
            "stats_data": {"widget_type": "table", "rows": []},
            "meta": {"source": "text_to_sql"},
        }

        with patch("app.services.ai_agent.agent.run_stats_agent", new=AsyncMock(return_value=mocked_stats_result)):
            result = await run_chat(
                "so sánh doanh thu theo danh mục trong 30 ngày gần nhất",
                user_id=1,
                user_role=UserRole.admin,
            )

        assert result["intent"] == "stats"
        assert result["response_type"] == "stats"
        assert result["meta"]["source"] == "text_to_sql"

    async def test_run_chat_admin_query_with_he_thong_forces_stats_sql(self):
        from app.models.user import UserRole
        from app.services.ai_agent.agent import run_chat

        mocked_stats_result = {
            "answer": "Khách hủy đơn nhiều nhất là A.",
            "stats_data": {"widget_type": "table", "rows": [{"user": "A", "cancel_count": 5}]},
            "meta": {"source": "text_to_sql"},
        }

        with patch("app.services.ai_agent.agent.run_stats_agent", new=AsyncMock(return_value=mocked_stats_result)):
            result = await run_chat(
                "khách nào hủy đơn nhiều nhất trong hệ thống",
                user_id=1,
                user_role=UserRole.admin,
            )

        assert result["intent"] == "stats"
        assert result["response_type"] == "stats"
        assert result["meta"]["source"] == "text_to_sql"


@pytest.mark.asyncio
class TestStatsHybridRouter:
    async def test_detect_stats_mode_rest(self):
        from app.services.ai_agent.agent import _detect_stats_mode

        assert _detect_stats_mode("cho tôi xem doanh thu tháng này") == "rest"

    async def test_detect_stats_mode_text_to_sql(self):
        from app.services.ai_agent.agent import _detect_stats_mode

        assert _detect_stats_mode("tỷ lệ chuyển đổi đơn hàng theo giờ trong 14 ngày") == "text_to_sql"

    async def test_detect_stats_mode_text_to_sql_for_complex_revenue_query(self):
        from app.services.ai_agent.agent import _detect_stats_mode

        assert _detect_stats_mode("báo cáo doanh thu theo danh mục tháng này") == "text_to_sql"

    async def test_detect_stats_mode_text_to_sql_when_contains_he_thong(self):
        from app.services.ai_agent.agent import _detect_stats_mode

        assert _detect_stats_mode("khách nào hủy đơn nhiều nhất trong hệ thống") == "text_to_sql"

    async def test_run_stats_agent_routes_to_rest(self):
        from app.services.ai_agent.agent import run_stats_agent

        mocked_result = {
            "answer": "REST stats",
            "stats_data": {"widget_type": "kpi", "items": []},
            "meta": {"source": "rest"},
        }

        with patch("app.services.ai_agent.agent.run_stats_rest_agent", new=AsyncMock(return_value=mocked_result)):
            result = await run_stats_agent("doanh thu tháng này")

        assert result["meta"]["source"] == "rest"
        assert result["stats_data"]["widget_type"] == "kpi"

    async def test_run_stats_rest_agent_top_products_uses_stats_service(self):
        from app.services.ai_agent.agent import run_stats_rest_agent

        mocked_items = [
            {
                "product_id": 1,
                "product_name": "Đèn Đá Muối A",
                "total_sold": 15,
                "total_revenue": 2990000.0,
            }
        ]

        with patch("app.db.session.AsyncSessionLocal", new=lambda: _FakeSessionContext()):
            with patch("app.services.crud.admin_statistics.get_top_products", new=AsyncMock(return_value=mocked_items)):
                result = await run_stats_rest_agent("top sản phẩm bán chạy")

        assert result["meta"]["source"] == "rest"
        assert result["stats_data"]["widget_type"] == "top_products"
        assert result["stats_data"]["items"] == mocked_items
        assert isinstance(result["stats_data"]["date_from"], str)
        assert isinstance(result["stats_data"]["date_to"], str)

    async def test_run_stats_agent_routes_to_text_to_sql(self):
        from app.services.ai_agent.agent import run_stats_agent

        mocked_report = {
            "answer": "Báo cáo linh hoạt",
            "sql_query": "SELECT * FROM orders LIMIT 10;",
            "raw_data": [{"id": 1}],
        }

        with patch("app.services.ai_agent.chains.admin_report.run_admin_report", new=AsyncMock(return_value=mocked_report)):
            result = await run_stats_agent("phân tích tỷ lệ chuyển đổi đơn hàng theo khung giờ")

        assert result["meta"]["source"] == "text_to_sql"
        assert result["stats_data"]["widget_type"] == "table"
        assert result["stats_data"]["rows"] == [{"id": 1}]

    async def test_run_stats_agent_complex_revenue_query_prefers_text_to_sql(self):
        from app.services.ai_agent.agent import run_stats_agent

        mocked_report = {
            "answer": "Báo cáo linh hoạt theo danh mục",
            "sql_query": "SELECT category_id, SUM(total_amount) FROM orders GROUP BY category_id;",
            "raw_data": [{"category_id": 1, "sum": 1000000}],
        }

        with patch("app.services.ai_agent.chains.admin_report.run_admin_report", new=AsyncMock(return_value=mocked_report)):
            result = await run_stats_agent("báo cáo doanh thu theo danh mục tháng này")

        assert result["meta"]["source"] == "text_to_sql"
        assert result["stats_data"]["widget_type"] == "table"


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

    async def test_rag_shipping_policy(self):
        """Hỏi về chính sách vận chuyển."""
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": "Phí vận chuyển được tính như thế nào?"})
        assert "answer" in result
        assert "sources" in result
        assert len(result["sources"]) > 0

    async def test_rag_return_policy(self):
        """Hỏi về chính sách đổi trả."""
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": "Sản phẩm lỗi có được đổi trả không?"})
        assert "answer" in result

    async def test_rag_warranty_policy(self):
        """Hỏi về chính sách bảo hành."""
        from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources
        chain = create_rag_chain_with_sources()
        result = await chain.ainvoke({"question": "Đèn đá muối được bảo hành bao lâu?"})
        assert "answer" in result


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
class TestCheckoutChatContract:
    """Unit tests cho contract checkout_form trong chat unified."""

    async def test_checkout_form_payload_shape(self):
        from app.services.ai_agent.agent import run_chat

        mocked_result = {
            "answer": "Mình đã thêm sản phẩm vào giỏ.",
            "cart_updated": True,
            "cart_item": {
                "product_id": 11,
                "product_name": "Đèn Đá Muối Mini",
                "product_slug": "den-da-muoi-mini",
                "image_url": "https://cdn.example.com/den-mini.jpg",
                "price": 199000,
                "quantity": 2,
            },
        }

        with patch("app.services.ai_agent.agent.run_ordering_agent", new=AsyncMock(return_value=mocked_result)):
            result = await run_chat("mua ngay 2 đèn mini", user_id=1)

        assert result["response_type"] == "checkout_form"
        assert result["intent"] == "checkout"
        assert "data" in result
        assert "cart_items" in result["data"]
        assert len(result["data"]["cart_items"]) == 1

        item = result["data"]["cart_items"][0]
        required_fields = {
            "product_id",
            "product_name",
            "product_slug",
            "image_url",
            "unit_price",
            "quantity",
            "subtotal",
        }
        assert required_fields.issubset(item.keys())
        assert isinstance(item["product_id"], int)
        assert isinstance(item["product_name"], str)
        assert isinstance(item["product_slug"], str)
        assert isinstance(item["image_url"], str)
        assert isinstance(item["unit_price"], float)
        assert isinstance(item["quantity"], int)
        assert isinstance(item["subtotal"], float)

    async def test_add_to_cart_returns_text_not_checkout_panel(self):
        from app.services.ai_agent.agent import run_chat

        mocked_result = {
            "answer": "Đã thêm 1 × 'Đá muối hình bình' vào giỏ hàng.",
            "cart_updated": True,
            "cart_item": {
                "product_id": 20,
                "product_name": "Đá muối hình bình",
                "product_slug": "da-muoi-hinh-binh",
                "image_url": "/static/uploads/demo.jpg",
                "price": 4520000,
                "quantity": 1,
            },
        }

        with patch("app.services.ai_agent.agent.run_ordering_agent", new=AsyncMock(return_value=mocked_result)):
            result = await run_chat("Thêm Đá muối hình bình vào giỏ hàng", user_id=1)

        assert result["response_type"] == "text"
        assert result["intent"] == "order"
        assert result.get("cart_updated") is True

    async def test_checkout_requires_login(self):
        from app.services.ai_agent.agent import run_chat

        result = await run_chat("thanh toán giúp mình", user_id=None)

        assert result["response_type"] == "text"
        assert "đăng nhập" in result["answer"].lower()

    async def test_checkout_empty_cart_fallback_text(self):
        from app.services.ai_agent.agent import run_chat

        mocked_result = {
            "answer": "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp.",
            "cart_updated": False,
            "cart_item": None,
        }

        with patch("app.services.ai_agent.agent.run_ordering_agent", new=AsyncMock(return_value=mocked_result)):
            result = await run_chat("checkout ngay", user_id=5)

        assert result["response_type"] == "text"
        assert "giỏ hàng" in result["answer"].lower()

    async def test_checkout_invalid_cart_data_no_500(self):
        from app.services.ai_agent.agent import run_chat

        mocked_result = {
            "answer": "Đã thêm sản phẩm.",
            "cart_updated": True,
            "cart_item": {
                "product_id": 0,
                "quantity": "abc",
            },
        }

        with patch("app.services.ai_agent.agent.run_ordering_agent", new=AsyncMock(return_value=mocked_result)):
            result = await run_chat("mua ngay", user_id=2)

        assert result["response_type"] == "text"
        assert result.get("cart_updated") is False
        assert "giỏ hàng" in result["answer"].lower()

    async def test_remove_from_cart_message_not_fallback_to_rag(self):
        from app.services.ai_agent.agent import run_chat

        mocked_result = {
            "answer": "Đã xóa 'Đá muối hình bình' khỏi giỏ hàng.",
            "cart_updated": False,
            "cart_removed": True,
            "cart_item": {
                "product_id": 20,
                "product_name": "Đá muối hình bình",
                "quantity": 0,
            },
        }

        with patch("app.services.ai_agent.agent.run_ordering_agent", new=AsyncMock(return_value=mocked_result)):
            result = await run_chat("Xóa Đá muối hình bình khỏi giỏ hàng", user_id=1)

        assert result["intent"] == "order"
        assert result["response_type"] == "text"
        assert "xóa" in result["answer"].lower()


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
