"""Router: Orders — /api/v1/orders"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, get_optional_user
from app.models.order import OrderStatus, PaymentMethod
from app.models.user import UserRole
from app.schemas.base import BaseResponse
from app.schemas.order import (
    OrderCreate,
    OrderListPage,
    OrderResponse,
    OrderItemResponse,
    OrderPaymentLinkResponse,
)
from app.services.crud import order as order_crud
from app.services.payment import vnpay

router = APIRouter()


def _build_vnpay_order_info(order_id: int) -> str:
    return f"Thanh toan don hang #{order_id}"


def _build_order_response(order) -> OrderResponse:
    """Builds OrderResponse from ORM Order, populating product info in items."""
    items_data = [
        OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
            product_name=item.product.name if item.product else None,
            image_url=item.product.image_url if item.product else None,
            product_slug=item.product.slug if item.product else None,
        )
        for item in order.items
    ]
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        receiver_name=order.receiver_name,
        receiver_phone=order.receiver_phone,
        receiver_address=order.receiver_address,
        note=order.note,
        payment_method=order.payment_method,
        status=order.status,
        total_amount=order.total_amount,
        items=items_data,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


# ---------------------------------------------------------------------------
# POST /orders — Tạo đơn hàng mới (checkout)
# ---------------------------------------------------------------------------
@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[OrderResponse],
    summary="Tạo đơn hàng (checkout) — guest hoặc đã đăng nhập",
)
async def create_order(
    body: OrderCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    if body.payment_method == PaymentMethod.bank_transfer and not vnpay.is_vnpay_enabled():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VNPay chưa được cấu hình trên hệ thống",
        )

    user_id = current_user.id if current_user else None
    order = await order_crud.create_order(db=db, data=body, user_id=user_id)

    order_response = OrderResponse.model_validate(order)
    if body.payment_method == PaymentMethod.bank_transfer:
        client_ip = request.client.host if request.client else "127.0.0.1"
        payment_url = vnpay.build_payment_url(
            order_id=order.id,
            amount_vnd=int(order.total_amount),
            order_info=_build_vnpay_order_info(order.id),
            client_ip=client_ip,
        )
        order_response = order_response.model_copy(update={"payment_url": payment_url})

    return BaseResponse.success(
        data=order_response,
        message="Đặt hàng thành công",
    )


@router.post(
    "/{order_id}/retry-payment",
    response_model=BaseResponse[OrderPaymentLinkResponse],
    summary="Tạo lại link thanh toán VNPay cho đơn chuyển khoản chưa thanh toán",
)
async def retry_order_payment(
    order_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not vnpay.is_vnpay_enabled():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VNPay chưa được cấu hình trên hệ thống",
        )

    order = await order_crud.get_order_by_id(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn hàng không tồn tại")

    is_admin = current_user.role == UserRole.admin
    if not is_admin and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thanh toán đơn hàng này",
        )

    if order.payment_method != PaymentMethod.bank_transfer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn hàng này không dùng phương thức chuyển khoản VNPay",
        )

    if order.status != OrderStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn hàng không ở trạng thái chờ thanh toán lại",
        )

    client_ip = request.client.host if request.client else "127.0.0.1"
    payment_url = vnpay.build_payment_url(
        order_id=order.id,
        amount_vnd=int(order.total_amount),
        order_info=_build_vnpay_order_info(order.id),
        client_ip=client_ip,
    )
    return BaseResponse.success(
        data=OrderPaymentLinkResponse(order_id=order.id, payment_url=payment_url),
        message="Tạo lại link thanh toán thành công",
    )


# ---------------------------------------------------------------------------
# GET /orders/my — Lịch sử đơn hàng của user
# ---------------------------------------------------------------------------
@router.get(
    "/my",
    response_model=BaseResponse[OrderListPage],
    summary="Lịch sử đơn hàng của tôi",
)
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    order_status: OrderStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    result = await order_crud.list_user_orders(
        db=db,
        user_id=current_user.id,
        order_status=order_status,
        page=page,
        limit=limit,
    )
    page_data = OrderListPage(
        items=[_build_order_response(o) for o in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )
    return BaseResponse.success(data=page_data)


# ---------------------------------------------------------------------------
# GET /orders/{order_id} — Chi tiết đơn hàng
# ---------------------------------------------------------------------------
@router.get(
    "/{order_id}",
    response_model=BaseResponse[OrderResponse],
    summary="Chi tiết một đơn hàng (chỉ xem đơn của mình hoặc admin)",
)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = await order_crud.get_order_by_id(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn hàng không tồn tại")

    # Chỉ cho xem đơn của mình, trừ admin
    is_admin = current_user.role == UserRole.admin
    if not is_admin and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xem đơn hàng này",
        )

    return BaseResponse.success(data=_build_order_response(order))
