"""Unit tests cho product_db_search (DB-first filters)."""

from __future__ import annotations

import pytest

from app.services.ai_agent.tools.product_db_search import (
    ProductFilterSpec,
    _score_product_name_match,
    build_keyword_condition,
    build_use_product_ids_subquery,
    extract_max_price_from_text,
    extract_min_price_from_text,
    extract_price_range_from_text,
    extract_product_name_hint,
    merge_price_fallback,
    parse_vnd_amount,
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


class TestMinPriceExtraction:
    def test_lon_hon_5_trieu_is_min_not_max(self):
        msg = "Tư vấn cho tôi sản phẩm lớn hơn 5 triệu"
        assert extract_min_price_from_text(msg) == 5_000_000
        assert extract_max_price_from_text(msg) is None

    def test_tren_3_trieu_min(self):
        assert extract_min_price_from_text("gợi ý đèn trên 3 triệu") == 3_000_000

    def test_name_hint_skipped_for_price_only(self):
        assert extract_product_name_hint("Tư vấn cho tôi sản phẩm lớn hơn 5 triệu") is None


class TestMergePriceFallback:
    def test_sets_sort_price_asc(self):
        spec = ProductFilterSpec()
        merged = merge_price_fallback(spec, "gợi ý dưới 300k")
        assert merged.max_price == 300_000
        assert merged.sort_by == "price_asc"

    def test_range_tu_1_trieu_den_1_trieu_5(self):
        spec = ProductFilterSpec()
        merged = merge_price_fallback(
            spec,
            "gợi ý sản phẩm có giá từ 1 triệu đến 1 triệu 5",
        )
        assert merged.min_price == 1_000_000
        assert merged.max_price == 1_500_000
        assert merged.sort_by == "price_asc"

    def test_lon_hon_sets_min_and_sort_desc(self):
        spec = ProductFilterSpec()
        merged = merge_price_fallback(spec, "sản phẩm lớn hơn 5 triệu")
        assert merged.min_price == 5_000_000
        assert merged.max_price is None
        assert merged.sort_by == "price_desc"

    def test_extract_max_skips_when_range_present(self):
        assert extract_max_price_from_text(
            "gợi ý sản phẩm có giá từ 1 triệu đến 1 triệu 5",
        ) is None


class TestPriceRangeExtraction:
    def test_extract_price_range(self):
        min_p, max_p = extract_price_range_from_text(
            "gợi ý sản phẩm có giá từ 1 triệu đến 1 triệu 5",
        )
        assert min_p == 1_000_000
        assert max_p == 1_500_000

    def test_parse_vnd_amount_trieu_5(self):
        assert parse_vnd_amount("1 triệu 5") == 1_500_000

    def test_parse_vnd_amount_decimal_trieu(self):
        assert parse_vnd_amount("1.5 triệu") == 1_500_000


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


class TestProductNameHint:
    def test_extract_from_tu_van_san_pham(self):
        msg = "Tư vấn cho tôi sản phẩm Đèn đá muối tự nhiên dài"
        assert extract_product_name_hint(msg) == "Đèn đá muối tự nhiên dài"

    def test_extract_none_for_order_query(self):
        assert extract_product_name_hint("xem đơn hàng của tôi") is None

    def test_extract_none_for_price_filter_phrase(self):
        assert extract_product_name_hint("Tư vấn sản phẩm trên 2 triệu") is None

    def test_score_exact_over_prefix(self):
        exact = _score_product_name_match(
            "Đèn đá muối tự nhiên dài",
            "Đèn đá muối tự nhiên dài",
        )
        prefix = _score_product_name_match(
            "Đèn đá muối tự nhiên",
            "Đèn đá muối tự nhiên dài",
        )
        assert exact > prefix


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
