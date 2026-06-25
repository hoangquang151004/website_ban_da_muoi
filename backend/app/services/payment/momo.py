from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime

import httpx

from app.core.config import settings


class MomoError(ValueError):
    """Raised when MoMo configuration or payload is invalid."""


def _hmac_sha256(raw: str, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()


def _create_signature_raw(
    *,
    access_key: str,
    amount: str,
    extra_data: str,
    ipn_url: str,
    order_id: str,
    order_info: str,
    partner_code: str,
    redirect_url: str,
    request_id: str,
    request_type: str,
) -> str:
    return (
        f"accessKey={access_key}&amount={amount}&extraData={extra_data}"
        f"&ipnUrl={ipn_url}&orderId={order_id}&orderInfo={order_info}"
        f"&partnerCode={partner_code}&redirectUrl={redirect_url}"
        f"&requestId={request_id}&requestType={request_type}"
    )


def _normalize_callback_params(payload: dict) -> dict[str, str]:
    return {k: "" if v is None else str(v) for k, v in payload.items() if k != "signature"}


def _return_signature_raw(payload: dict[str, str]) -> str:
    """Chữ ký khi MoMo redirect về returnUrl (GET) — có orderType, accessKey từ config."""
    fields = [
        ("accessKey", settings.MOMO_ACCESS_KEY),
        ("amount", payload.get("amount", "")),
        ("extraData", payload.get("extraData", "")),
        ("message", payload.get("message", "")),
        ("orderId", payload.get("orderId", "")),
        ("orderInfo", payload.get("orderInfo", "")),
        ("orderType", payload.get("orderType", "")),
        ("partnerCode", payload.get("partnerCode", "")),
        ("payType", payload.get("payType", "")),
        ("requestId", payload.get("requestId", "")),
        ("responseTime", payload.get("responseTime", "")),
        ("resultCode", payload.get("resultCode", "")),
        ("transId", payload.get("transId", "")),
    ]
    return "&".join(f"{key}={value}" for key, value in fields)


def _ipn_signature_raw(payload: dict[str, str]) -> str:
    """Chữ ký IPN (POST JSON) — accessKey có trong payload."""
    fields = [
        ("accessKey", payload.get("accessKey", settings.MOMO_ACCESS_KEY)),
        ("amount", str(payload.get("amount", ""))),
        ("extraData", payload.get("extraData", "")),
        ("message", payload.get("message", "")),
        ("orderId", payload.get("orderId", "")),
        ("orderInfo", payload.get("orderInfo", "")),
        ("partnerCode", payload.get("partnerCode", "")),
        ("payType", str(payload.get("payType", ""))),
        ("requestId", payload.get("requestId", "")),
        ("responseTime", str(payload.get("responseTime", ""))),
        ("resultCode", str(payload.get("resultCode", ""))),
        ("transId", str(payload.get("transId", ""))),
    ]
    return "&".join(f"{key}={value}" for key, value in fields)


def is_momo_enabled() -> bool:
    return bool(
        settings.MOMO_PARTNER_CODE
        and settings.MOMO_ACCESS_KEY
        and settings.MOMO_SECRET_KEY
    )


def build_momo_order_id(order_id: int) -> str:
    return f"{order_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"


def extract_order_id(momo_order_id: str) -> int | None:
    if not momo_order_id:
        return None
    raw = momo_order_id.split("_", maxsplit=1)[0]
    return int(raw) if raw.isdigit() else None


# MoMo requestType (Payment Gateway v2):
# - captureWallet: thanh toán quét mã / ví MoMo
# - payWithATM: thẻ nội địa / Internet Banking, nhập số thẻ hoặc TK trên trang MoMo
MOMO_REQUEST_CAPTURE_WALLET = "captureWallet"
MOMO_REQUEST_PAY_WITH_ATM = "payWithATM"


async def create_payment_url(
    *,
    order_id: int,
    amount_vnd: int,
    order_info: str,
    request_type: str | None = None,
) -> str:
    if not is_momo_enabled():
        raise MomoError(
            "MoMo chưa được cấu hình. Vui lòng kiểm tra MOMO_PARTNER_CODE, "
            "MOMO_ACCESS_KEY và MOMO_SECRET_KEY"
        )
    if amount_vnd <= 0:
        raise MomoError("Số tiền thanh toán phải lớn hơn 0")

    momo_order_id = build_momo_order_id(order_id)
    request_id = momo_order_id
    amount = str(amount_vnd)
    extra_data = ""
    req_type = request_type or settings.MOMO_REQUEST_TYPE

    raw_signature = _create_signature_raw(
        access_key=settings.MOMO_ACCESS_KEY,
        amount=amount,
        extra_data=extra_data,
        ipn_url=settings.momo_ipn_endpoint,
        order_id=momo_order_id,
        order_info=order_info,
        partner_code=settings.MOMO_PARTNER_CODE,
        redirect_url=settings.MOMO_RETURN_URL,
        request_id=request_id,
        request_type=req_type,
    )
    signature = _hmac_sha256(raw_signature, settings.MOMO_SECRET_KEY)

    body = {
        "partnerCode": settings.MOMO_PARTNER_CODE,
        "partnerName": settings.MOMO_PARTNER_NAME,
        "storeId": settings.MOMO_STORE_ID,
        "requestId": request_id,
        "amount": amount,
        "orderId": momo_order_id,
        "orderInfo": order_info,
        "redirectUrl": settings.MOMO_RETURN_URL,
        "ipnUrl": settings.momo_ipn_endpoint,
        "lang": "vi",
        "extraData": extra_data,
        "requestType": req_type,
        "signature": signature,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            settings.momo_create_endpoint,
            content=json.dumps(body),
            headers={"Content-Type": "application/json"},
        )

    if response.status_code >= 400:
        raise MomoError(f"MoMo API lỗi HTTP {response.status_code}")

    data = response.json()
    result_code = int(data.get("resultCode", -1))
    if result_code != 0:
        message = data.get("message", "Không tạo được phiên thanh toán MoMo")
        raise MomoError(str(message))

    pay_url = data.get("payUrl")
    if not pay_url:
        raise MomoError("MoMo không trả về payUrl")

    return str(pay_url)


def _verify_signature(payload: dict, raw_builder) -> bool:
    signature = payload.get("signature")
    if not signature:
        return False
    normalized = _normalize_callback_params(payload)
    raw = raw_builder(normalized)
    expected = _hmac_sha256(raw, settings.MOMO_SECRET_KEY)
    return expected.lower() == str(signature).lower()


def verify_return_signature(payload: dict) -> bool:
    """Xác thực query string khi user quay về từ trang MoMo."""
    return _verify_signature(payload, _return_signature_raw)


def verify_ipn_signature(payload: dict) -> bool:
    """Xác thực webhook IPN (server-to-server)."""
    return _verify_signature(payload, _ipn_signature_raw)


def is_paid_result(result_code: str | int | None) -> bool:
    return str(result_code) == "0"
