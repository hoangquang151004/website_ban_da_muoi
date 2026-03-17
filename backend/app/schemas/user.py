from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import UserGender, UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str | None = None
    address: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    address: str | None = None
    is_active: bool | None = None


class UserUpdateProfile(BaseModel):
    """Schema cho user tự cập nhật hồ sơ cá nhân và đổi mật khẩu."""
    full_name: str | None = None
    phone: str | None = None
    date_of_birth: Optional[date] = None
    gender: Optional[UserGender] = None
    # Address fields
    address: str | None = None
    ward: str | None = None
    district: str | None = None
    city: str | None = None
    postal_code: str | None = None
    address_note: str | None = None
    # Password change
    current_password: str | None = None
    new_password: str | None = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    date_of_birth: date | None
    gender: UserGender | None
    avatar_url: str | None
    address: str | None
    ward: str | None
    district: str | None
    city: str | None
    postal_code: str | None
    address_note: str | None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    """Schema an toàn trả về khi không cần ẩn field nhạy cảm ngoài hashed_password."""
    id: int
    full_name: str
    email: str
    phone: str | None
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


class UserAdminUpdate(BaseModel):
    """Schema cho Admin cập nhật tài khoản người dùng, bao gồm đổi role."""
    full_name: str | None = None
    phone: str | None = None
    address: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserAdminResponse(UserResponse):
    """UserResponse mở rộng kèm thống kê đơn hàng."""
    order_count: int = 0
    total_spent: float = 0.0


class UserStatusUpdate(BaseModel):
    is_active: bool


# ---------------------------------------------------------------------------
# Auth-specific schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
