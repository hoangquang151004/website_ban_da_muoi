"""Chọn cổng thanh toán trực tuyến (VNPay / MoMo)."""
from __future__ import annotations

from app.models.order import PaymentMethod
from app.services.payment import momo, vnpay

ONLINE_PAYMENT_METHODS = frozenset(
    {
        PaymentMethod.bank_transfer,
        PaymentMethod.vnpay,
        PaymentMethod.momo,
    }
)


def normalize_online_method(method: PaymentMethod) -> PaymentMethod:
    """bank_transfer (cũ) được coi là VNPay."""
    if method == PaymentMethod.bank_transfer:
        return PaymentMethod.vnpay
    return method


def is_online_payment(method: PaymentMethod) -> bool:
    return method in ONLINE_PAYMENT_METHODS


def is_online_payment_enabled(method: PaymentMethod) -> bool:
    provider = normalize_online_method(method)
    if provider == PaymentMethod.vnpay:
        return vnpay.is_vnpay_enabled()
    if provider == PaymentMethod.momo:
        return momo.is_momo_enabled()
    return False


async def build_payment_url(
    *,
    method: PaymentMethod,
    order_id: int,
    amount_vnd: int,
    order_info: str,
    client_ip: str,
) -> str:
    provider = normalize_online_method(method)
    if provider == PaymentMethod.vnpay:
        return vnpay.build_payment_url(
            order_id=order_id,
            amount_vnd=amount_vnd,
            order_info=order_info,
            client_ip=client_ip,
        )
    if provider == PaymentMethod.momo:
        return await momo.create_payment_url(
            order_id=order_id,
            amount_vnd=amount_vnd,
            order_info=order_info,
        )
    raise ValueError(f"Phương thức thanh toán không hỗ trợ cổng trực tuyến: {method}")
