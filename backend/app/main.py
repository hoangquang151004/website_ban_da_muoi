from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.schemas.base import BaseResponse

# ---------------------------------------------------------------------------
# Khởi tạo FastAPI instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Exception Handlers — đảm bảo mọi lỗi đều trả về BaseResponse format
# ---------------------------------------------------------------------------


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=BaseResponse.error(message=exc.detail).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = exc.errors()
    message = "; ".join(
        f"{' -> '.join(str(loc) for loc in e['loc'])}: {e['msg']}" for e in errors
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=BaseResponse.error(message=message, data=errors).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=BaseResponse.error(message="Internal server error").model_dump(),
    )


# ---------------------------------------------------------------------------
# Routers — thêm include_router khi có router mới
# ---------------------------------------------------------------------------
from app.routers import auth  # noqa: E402
from app.routers import orders  # noqa: E402
from app.routers import products  # noqa: E402
from app.routers import admin_catalog  # noqa: E402
from app.routers import admin_products  # noqa: E402
from app.routers import admin_orders  # noqa: E402
from app.routers import admin_users  # noqa: E402
from app.routers import admin_reviews  # noqa: E402
from app.routers import admin_stock  # noqa: E402
from app.routers import admin_statistics  # noqa: E402
from app.routers import admin_data  # noqa: E402
from app.routers import chat  # noqa: E402
from app.routers import admin_chat  # noqa: E402
from app.routers import payments  # noqa: E402

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/v1", tags=["Products / Categories / Uses / Reviews"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])

# Admin routers
app.include_router(admin_catalog.router, prefix="/api/v1/admin", tags=["Admin — Catalog"])
app.include_router(admin_products.router, prefix="/api/v1/admin", tags=["Admin — Products"])
app.include_router(admin_orders.router, prefix="/api/v1/admin", tags=["Admin — Orders"])
app.include_router(admin_users.router, prefix="/api/v1/admin", tags=["Admin — Users"])
app.include_router(admin_reviews.router, prefix="/api/v1/admin", tags=["Admin — Reviews"])
app.include_router(admin_stock.router, prefix="/api/v1/admin", tags=["Admin — Stock"])
app.include_router(admin_statistics.router, prefix="/api/v1/admin", tags=["Admin — Statistics"])
app.include_router(admin_data.router, prefix="/api/v1/admin", tags=["Admin — Data Sources"])

# AI Agent / Chat routers
app.include_router(chat.router, prefix="/api/v1", tags=["Chat — AI Agent"])
app.include_router(admin_chat.router, prefix="/api/v1/admin", tags=["Admin — AI Chat"])

# ---------------------------------------------------------------------------
# Static files (uploaded images)
# ---------------------------------------------------------------------------
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(os.path.join(_static_dir, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=_static_dir), name="static")


# ---------------------------------------------------------------------------
# Health check endpoint
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    return BaseResponse.success(data={"status": "ok"}, message="Server is running")
