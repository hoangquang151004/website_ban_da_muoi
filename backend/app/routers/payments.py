from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_db
from app.models.order import OrderStatus
from app.services.crud import order as order_crud
from app.services.payment import momo, vnpay

router = APIRouter()


def _payment_result_url(
    *,
    paid: bool,
    order_id: int,
    gateway: str,
    response_code: str,
) -> str:
    result = "success" if paid else "failed"
    return (
        f"{settings.FRONTEND_URL}/checkout/payment-result"
        f"?status={result}&order_id={order_id}&gateway={gateway}"
        f"&response_code={response_code}"
    )


@router.get(
    "/vnpay/return",
    summary="VNPay return callback",
)
async def vnpay_return(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redirect: bool = Query(True, description="Redirect ve frontend sau khi xu ly"),
):
    params = dict(request.query_params)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thiếu tham số callback từ VNPay",
        )

    if not vnpay.verify_return_params(params):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sai chữ ký VNPay",
        )

    response_code = params.get("vnp_ResponseCode", "")
    transaction_status = params.get("vnp_TransactionStatus", "")
    txn_ref = params.get("vnp_TxnRef", "")
    order_id = vnpay.extract_order_id(txn_ref)

    if order_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã giao dịch không hợp lệ",
        )

    paid = response_code == "00" and transaction_status in {"", "00"}
    if paid:
        await order_crud.update_order_status(db, order_id, OrderStatus.confirmed)

    if redirect:
        url = _payment_result_url(
            paid=paid,
            order_id=order_id,
            gateway="vnpay",
            response_code=response_code,
        )
        return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)

    return {
        "status": "success" if paid else "failed",
        "order_id": order_id,
        "gateway": "vnpay",
        "response_code": response_code,
        "transaction_status": transaction_status,
    }


@router.get(
    "/momo/return",
    summary="MoMo return callback (redirect)",
)
async def momo_return(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redirect: bool = Query(True),
):
    params = dict(request.query_params)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thiếu tham số callback từ MoMo",
        )

    if not momo.verify_return_signature(params):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sai chữ ký MoMo (return callback)",
        )

    result_code = params.get("resultCode", "")
    momo_order_id = params.get("orderId", "")
    order_id = momo.extract_order_id(momo_order_id)

    if order_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã giao dịch không hợp lệ",
        )

    paid = momo.is_paid_result(result_code)
    if paid:
        await order_crud.update_order_status(db, order_id, OrderStatus.confirmed)

    if redirect:
        url = _payment_result_url(
            paid=paid,
            order_id=order_id,
            gateway="momo",
            response_code=str(result_code),
        )
        return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)

    return {
        "status": "success" if paid else "failed",
        "order_id": order_id,
        "gateway": "momo",
        "response_code": str(result_code),
    }


@router.post(
    "/momo/ipn",
    summary="MoMo IPN webhook",
)
async def momo_ipn(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload IPN không hợp lệ",
        ) from exc

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload IPN không hợp lệ",
        )

    if not momo.verify_ipn_signature(payload):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sai chữ ký MoMo IPN",
        )

    result_code = payload.get("resultCode", "")
    momo_order_id = payload.get("orderId", "")
    order_id = momo.extract_order_id(str(momo_order_id))

    if order_id is not None and momo.is_paid_result(result_code):
        await order_crud.update_order_status(db, order_id, OrderStatus.confirmed)

    return {"message": "OK"}
