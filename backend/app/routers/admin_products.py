"""Admin sub-router: Product management + file upload."""
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.schemas.base import BaseResponse
from app.schemas.product import ProductAdminListPage, ProductCreate, ProductResponse, ProductUpdate
from app.services.crud import admin_product as svc

router = APIRouter(dependencies=[Depends(require_admin)])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "uploads")
ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/webp",
    "model/gltf-binary", "model/gltf+json", "application/octet-stream"
}
MAX_SIZE = 50 * 1024 * 1024  # 50 MB


@router.get("/products", response_model=BaseResponse[ProductAdminListPage])
async def list_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    category_id: int | None = Query(None),
    is_active: bool | None = Query(None),
):
    result = await svc.list_products_admin(db, page, limit, search, category_id, is_active)
    page_data = ProductAdminListPage(
        items=[ProductResponse.model_validate(p) for p in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )
    return BaseResponse.success(data=page_data)


@router.post("/products", status_code=status.HTTP_201_CREATED, response_model=BaseResponse[ProductResponse])
async def create_product(body: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = await svc.create_product(db, body)
    return BaseResponse.success(
        data=ProductResponse.model_validate(product),
        message="Tạo sản phẩm thành công",
    )


@router.put("/products/{product_id}", response_model=BaseResponse[ProductResponse])
async def update_product(product_id: int, body: ProductUpdate, db: AsyncSession = Depends(get_db)):
    product = await svc.update_product(db, product_id, body)
    return BaseResponse.success(data=ProductResponse.model_validate(product))


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    await svc.soft_delete_product(db, product_id)


@router.post("/upload", response_model=BaseResponse[dict])
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES and not file.filename.endswith(('.glb', '.gltf')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ chấp nhận file ảnh (jpg, png, webp) hoặc mô hình 3D (glb, gltf)",
        )
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File vượt quá 50MB",
        )
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "file"
    filename = f"{uuid.uuid4().hex}.{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
    return BaseResponse.success(data={"url": f"/static/uploads/{filename}"})
