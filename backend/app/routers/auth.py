"""Router: Authentication & Authorization — /api/v1/auth"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.security import create_access_token
from app.schemas.base import BaseResponse
from app.schemas.user import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserUpdateProfile,
)
from app.services.crud.user import (
    create_user,
    get_user_by_email,
    update_user_profile,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /register — Đăng ký tài khoản
# ---------------------------------------------------------------------------
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[TokenResponse],
    summary="Đăng ký tài khoản mới",
)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng",
        )
    user = await create_user(db, body)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    return BaseResponse.success(
        data=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        ),
        message="Đăng ký thành công",
    )


# ---------------------------------------------------------------------------
# POST /login — Đăng nhập
# ---------------------------------------------------------------------------
@router.post(
    "/login",
    response_model=BaseResponse[TokenResponse],
    summary="Đăng nhập và nhận JWT token",
)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, body.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
        )

    from app.core.security import verify_password
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị khóa",
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    return BaseResponse.success(
        data=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        ),
        message="Đăng nhập thành công",
    )


# ---------------------------------------------------------------------------
# GET /me — Lấy thông tin user hiện tại
# ---------------------------------------------------------------------------
@router.get(
    "/me",
    response_model=BaseResponse[UserResponse],
    summary="Lấy thông tin tài khoản hiện tại",
)
async def get_me(current_user=Depends(get_current_user)):
    return BaseResponse.success(data=UserResponse.model_validate(current_user))


# ---------------------------------------------------------------------------
# PUT /me — Cập nhật hồ sơ cá nhân
# ---------------------------------------------------------------------------
@router.put(
    "/me",
    response_model=BaseResponse[UserResponse],
    summary="Cập nhật hồ sơ cá nhân / đổi mật khẩu",
)
async def update_me(
    body: UserUpdateProfile,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await update_user_profile(db, current_user, body)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return BaseResponse.success(
        data=UserResponse.model_validate(user),
        message="Cập nhật thành công",
    )
