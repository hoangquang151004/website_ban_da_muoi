"""Router: Products, Categories, Uses, Reviews — /api/v1"""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.schemas.base import BaseResponse
from app.schemas.category import CategoryResponse
from app.schemas.product import ProductListItem, ProductListPage, ProductResponse
from app.schemas.review import ReviewListResponse, ReviewResponse, ReviewSubmit
from app.schemas.use import UseResponse
from app.services.crud import product as product_crud
from app.services.crud import review as review_crud

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /categories
# ---------------------------------------------------------------------------
@router.get(
    "/categories",
    response_model=BaseResponse[list[CategoryResponse]],
    summary="Danh sách danh mục (active)",
)
async def list_categories(db: AsyncSession = Depends(get_db)):
    categories = await product_crud.list_categories_active(db)
    return BaseResponse.success(data=[CategoryResponse(**c) for c in categories])


# ---------------------------------------------------------------------------
# GET /uses
# ---------------------------------------------------------------------------
@router.get(
    "/uses",
    response_model=BaseResponse[list[UseResponse]],
    summary="Danh sách công dụng (active)",
)
async def list_uses(db: AsyncSession = Depends(get_db)):
    uses = await product_crud.list_uses_active(db)
    return BaseResponse.success(data=[UseResponse.model_validate(u) for u in uses])


# ---------------------------------------------------------------------------
# GET /products
# ---------------------------------------------------------------------------
@router.get(
    "/products",
    response_model=BaseResponse[ProductListPage],
    summary="Danh sách sản phẩm (có lọc, phân trang)",
)
async def list_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_slug: str | None = Query(None),
    use_id: int | None = Query(None),
    is_featured: bool | None = Query(None),
    min_price: Decimal | None = Query(None),
    max_price: Decimal | None = Query(None),
    search: str | None = Query(None),
    sort_by: str | None = Query(None, pattern="^(price_asc|price_desc|newest)$"),
):
    result = await product_crud.list_products(
        db=db,
        page=page,
        limit=limit,
        category_slug=category_slug,
        use_id=use_id,
        is_featured=is_featured,
        min_price=min_price,
        max_price=max_price,
        search=search,
        sort_by=sort_by,
    )
    page_data = ProductListPage(
        items=[ProductListItem.model_validate(p) for p in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )
    return BaseResponse.success(data=page_data)


# ---------------------------------------------------------------------------
# GET /products/{slug}
# ---------------------------------------------------------------------------
@router.get(
    "/products/{slug}",
    response_model=BaseResponse[ProductResponse],
    summary="Chi tiết một sản phẩm",
)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    product = await product_crud.get_product_by_slug(db, slug)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sản phẩm không tồn tại")

    approved_reviews = [r for r in product.reviews if r.is_approved]
    avg = product_crud.compute_average_rating(product.reviews)

    data = ProductResponse.model_validate(product)
    data.reviews = [ReviewResponse.model_validate(r) for r in approved_reviews]
    data.average_rating = avg
    return BaseResponse.success(data=data)


# ---------------------------------------------------------------------------
# POST /products/{product_id}/reviews
# ---------------------------------------------------------------------------
@router.post(
    "/products/{product_id}/reviews",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[ReviewResponse],
    summary="Gửi đánh giá sản phẩm (phải đã mua & nhận hàng)",
)
async def submit_review(
    product_id: int,
    body: ReviewSubmit,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    review = await review_crud.create_review(
        db=db,
        user_id=current_user.id,
        product_id=product_id,
        data=body,
    )
    return BaseResponse.success(
        data=ReviewResponse.model_validate(review),
        message="Đánh giá đã được gửi và đang chờ duyệt",
    )


# ---------------------------------------------------------------------------
# GET /products/{product_id}/reviews
# ---------------------------------------------------------------------------
@router.get(
    "/products/{product_id}/reviews",
    response_model=BaseResponse[ReviewListResponse],
    summary="Xem đánh giá sản phẩm (chỉ review đã duyệt)",
)
async def list_reviews(product_id: int, db: AsyncSession = Depends(get_db)):
    reviews, avg = await review_crud.list_approved_reviews(db, product_id)
    return BaseResponse.success(
        data=ReviewListResponse(
            items=[ReviewResponse.model_validate(r) for r in reviews],
            average_rating=avg,
        )
    )
