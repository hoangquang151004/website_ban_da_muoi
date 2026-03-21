from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_db
from app.models.order import OrderStatus
from app.services.crud import order as order_crud
from app.services.payment import vnpay

router = APIRouter()


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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Thiếu tham số callback từ VNPay")

    if not vnpay.verify_return_params(params):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sai chữ ký VNPay")

    response_code = params.get("vnp_ResponseCode", "")
    transaction_status = params.get("vnp_TransactionStatus", "")
    txn_ref = params.get("vnp_TxnRef", "")
    order_id = vnpay.extract_order_id(txn_ref)

    if order_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã giao dịch không hợp lệ")

    paid = response_code == "00" and transaction_status in {"", "00"}
    if paid:
        await order_crud.update_order_status(db, order_id, OrderStatus.confirmed)

    if redirect:
        result = "success" if paid else "failed"
        frontend_url = (
            f"{settings.FRONTEND_URL}/checkout/payment-result"
            f"?status={result}&order_id={order_id}&response_code={response_code}"
        )
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_302_FOUND)

    return {
        "status": "success" if paid else "failed",
        "order_id": order_id,
        "response_code": response_code,
        "transaction_status": transaction_status,
    }
