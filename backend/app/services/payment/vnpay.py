from __future__ import annotations

import hashlib
import hmac
from datetime import datetime
from urllib.parse import quote_plus

from app.core.config import settings


class VnPayError(ValueError):
    """Raised when VNPay configuration or payload is invalid."""


def _build_sign_data(params: dict[str, str]) -> str:
    sorted_pairs = sorted(params.items())
    return "&".join(f"{key}={quote_plus(str(value))}" for key, value in sorted_pairs)


def _hmac_sha512(data: str, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), data.encode("utf-8"), hashlib.sha512).hexdigest()


def is_vnpay_enabled() -> bool:
    return bool(settings.VNPAY_TMN_CODE and settings.VNPAY_HASH_SECRET)


def build_payment_url(
    *,
    order_id: int,
    amount_vnd: int,
    order_info: str,
    client_ip: str,
) -> str:
    if not is_vnpay_enabled():
        raise VnPayError("VNPay chưa được cấu hình. Vui lòng kiểm tra VNPAY_TMN_CODE và VNPAY_HASH_SECRET")
    if amount_vnd <= 0:
        raise VnPayError("Số tiền thanh toán phải lớn hơn 0")

    txn_ref = f"{order_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    now = datetime.now().strftime("%Y%m%d%H%M%S")

    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": settings.VNPAY_TMN_CODE,
        "vnp_Amount": str(amount_vnd * 100),
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": txn_ref,
        "vnp_OrderInfo": order_info,
        "vnp_OrderType": settings.VNPAY_ORDER_TYPE,
        "vnp_Locale": "vn",
        "vnp_ReturnUrl": settings.VNPAY_RETURN_URL,
        "vnp_IpAddr": client_ip or "127.0.0.1",
        "vnp_CreateDate": now,
    }

    sign_data = _build_sign_data(params)
    secure_hash = _hmac_sha512(sign_data, settings.VNPAY_HASH_SECRET)
    query_string = f"{sign_data}&vnp_SecureHash={secure_hash}"
    return f"{settings.VNPAY_PAYMENT_URL}?{query_string}"


def verify_return_params(query_params: dict[str, str]) -> bool:
    secure_hash = query_params.get("vnp_SecureHash")
    if not secure_hash:
        return False

    payload = {
        key: value
        for key, value in query_params.items()
        if key.startswith("vnp_") and key not in {"vnp_SecureHash", "vnp_SecureHashType"}
    }
    sign_data = _build_sign_data(payload)
    expected_hash = _hmac_sha512(sign_data, settings.VNPAY_HASH_SECRET)
    return expected_hash.lower() == secure_hash.lower()


def extract_order_id(txn_ref: str) -> int | None:
    if not txn_ref:
        return None
    raw = txn_ref.split("_", maxsplit=1)[0]
    return int(raw) if raw.isdigit() else None
