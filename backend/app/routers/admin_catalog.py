"""Admin sub-router: Categories & Uses management."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.schemas.base import BaseResponse, PaginatedData
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate, StatusToggle
from app.schemas.use import UseCreate, UseResponse, UseUpdate
from app.services.crud import admin_catalog as svc

router = APIRouter(dependencies=[Depends(require_admin)])


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

@router.get("/categories", response_model=BaseResponse[PaginatedData[CategoryResponse]])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
):
    result = await svc.list_categories_admin(db, page, limit, search, is_active)
    page_data = PaginatedData(
        items=[CategoryResponse(**item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )
    return BaseResponse.success(data=page_data)


@router.post("/categories", status_code=status.HTTP_201_CREATED, response_model=BaseResponse[CategoryResponse])
async def create_category(body: CategoryCreate, db: AsyncSession = Depends(get_db)):
    data = await svc.create_category(db, body)
    return BaseResponse.success(data=CategoryResponse(**data), message="Tạo danh mục thành công")


@router.put("/categories/{cat_id}", response_model=BaseResponse[CategoryResponse])
async def update_category(cat_id: int, body: CategoryUpdate, db: AsyncSession = Depends(get_db)):
    data = await svc.update_category(db, cat_id, body)
    return BaseResponse.success(data=CategoryResponse(**data))


@router.patch("/categories/{cat_id}/status", response_model=BaseResponse[CategoryResponse])
async def toggle_category_status(cat_id: int, body: StatusToggle, db: AsyncSession = Depends(get_db)):
    data = await svc.toggle_category_status(db, cat_id, body.is_active)
    return BaseResponse.success(data=CategoryResponse(**data))


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(cat_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_category(db, cat_id)


# ---------------------------------------------------------------------------
# Uses
# ---------------------------------------------------------------------------

@router.get("/uses", response_model=BaseResponse[list[UseResponse]])
async def list_uses(db: AsyncSession = Depends(get_db), is_active: bool | None = Query(None)):
    uses = await svc.list_uses_admin(db, is_active)
    return BaseResponse.success(data=[UseResponse.model_validate(u) for u in uses])


@router.post("/uses", status_code=status.HTTP_201_CREATED, response_model=BaseResponse[UseResponse])
async def create_use(body: UseCreate, db: AsyncSession = Depends(get_db)):
    use = await svc.create_use(db, body)
    return BaseResponse.success(data=UseResponse.model_validate(use), message="Tạo công dụng thành công")


@router.put("/uses/{use_id}", response_model=BaseResponse[UseResponse])
async def update_use(use_id: int, body: UseUpdate, db: AsyncSession = Depends(get_db)):
    use = await svc.update_use(db, use_id, body)
    return BaseResponse.success(data=UseResponse.model_validate(use))


@router.patch("/uses/{use_id}/status", response_model=BaseResponse[UseResponse])
async def toggle_use_status(use_id: int, body: StatusToggle, db: AsyncSession = Depends(get_db)):
    use = await svc.toggle_use_status(db, use_id, body.is_active)
    return BaseResponse.success(data=UseResponse.model_validate(use))


@router.delete("/uses/{use_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_use(use_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_use(db, use_id)
