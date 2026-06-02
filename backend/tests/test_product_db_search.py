"""Unit tests cho product_db_search (DB-first filters)."""

from __future__ import annotations

import pytest

from app.services.ai_agent.tools.product_db_search import (
    ProductFilterSpec,
    build_keyword_condition,
    build_use_product_ids_subquery,
    extract_max_price_from_text,
    merge_price_fallback,
)
from app.services.ai_agent.chains.rag_chain import (
    RAG_REDIRECT_SHOPPING_ANSWER,
    polish_rag_answer,
)


class TestPriceExtraction:
    def test_extract_500k(self):
        assert extract_max_price_from_text("tư vấn đèn dưới 500k") == 500_000

    def test_extract_triệu(self):
        assert extract_max_price_from_text("đèn tầm 2 triệu") == 2_000_000


class TestMergePriceFallback:
    def test_sets_sort_price_asc(self):
        spec = ProductFilterSpec()
        merged = merge_price_fallback(spec, "gợi ý dưới 300k")
        assert merged.max_price == 300_000
        assert merged.sort_by == "price_asc"


class TestFilterBuilders:
    def test_keyword_condition_any(self):
        cond = build_keyword_condition(["ngủ", "thư giãn"], "any")
        assert cond is not None

    def test_keyword_condition_all(self):
        cond = build_keyword_condition(["đèn", "bàn"], "all")
        assert cond is not None

    def test_use_subquery_any(self):
        subq = build_use_product_ids_subquery([1, 2], "any")
        assert subq is not None

    def test_use_subquery_all(self):
        subq = build_use_product_ids_subquery([1, 2], "all")
        assert subq is not None


class TestRagPolish:
    def test_no_info_replaced(self):
        assert polish_rag_answer("Tôi chưa có thông tin về điều này.") == RAG_REDIRECT_SHOPPING_ANSWER

    def test_normal_answer_kept(self):
        text = "Đèn đá muối giúp thư giãn tốt."
        assert polish_rag_answer(text) == text


class TestShoppingQueryHeuristic:
    def test_tu_van_duoi_500k(self):
        from app.services.ai_agent.agent import _looks_like_product_shopping_query

        assert _looks_like_product_shopping_query("tư vấn sản phẩm dưới 500k") is True

    def test_phong_thuy_only_false(self):
        from app.services.ai_agent.agent import _looks_like_product_shopping_query

        assert _looks_like_product_shopping_query("phong thủy đặt đèn ở đâu") is False

    def test_goi_y_den(self):
        from app.services.ai_agent.agent import _looks_like_product_shopping_query

        assert _looks_like_product_shopping_query("gợi ý đèn phòng ngủ") is True
