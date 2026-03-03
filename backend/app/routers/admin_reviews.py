"""Admin sub-router: Review moderation."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.schemas.base import BaseResponse, PaginatedData
from app.schemas.review import ReviewAdminResponse, ReviewAdminUpdate
from app.services.crud import admin_review as svc

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/reviews", response_model=BaseResponse[PaginatedData[ReviewAdminResponse]])
async def list_reviews(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    is_approved: bool | None = Query(False),
    product_id: int | None = Query(None),
):
    result = await svc.list_reviews_admin(db, page, limit, is_approved, product_id)
    page_data = PaginatedData(
        items=[ReviewAdminResponse(**item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )
    return BaseResponse.success(data=page_data)


@router.put("/reviews/{review_id}", response_model=BaseResponse[ReviewAdminResponse])
async def update_review(
    review_id: int, body: ReviewAdminUpdate, db: AsyncSession = Depends(get_db)
):
    if body.is_approved is None:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp is_approved")
    data = await svc.update_review_approval(db, review_id, body.is_approved)
    return BaseResponse.success(data=ReviewAdminResponse(**data))


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(review_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_review(db, review_id)
