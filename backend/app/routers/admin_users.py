"""Admin sub-router: Customer management."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_admin
from app.schemas.base import BaseResponse, PaginatedData
from app.schemas.user import UserAdminResponse, UserStatusUpdate
from app.services.crud import admin_user as svc

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/users", response_model=BaseResponse[PaginatedData[UserAdminResponse]])
async def list_users(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
):
    result = await svc.list_users_admin(db, page, limit, search, is_active)
    page_data = PaginatedData(
        items=[UserAdminResponse(**item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )
    return BaseResponse.success(data=page_data)


@router.put("/users/{user_id}/status", response_model=BaseResponse[UserAdminResponse])
async def toggle_user_status(
    user_id: int,
    body: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_user),
):
    user = await svc.toggle_user_status(db, user_id, body.is_active, current_admin.id)
    return BaseResponse.success(
        data=UserAdminResponse.model_validate({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "address": user.address,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "order_count": 0,
            "total_spent": 0.0,
        })
    )
