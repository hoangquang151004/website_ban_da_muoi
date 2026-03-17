"""CRUD operations cho User model."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdateProfile


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    """Tạo user mới với role=customer."""
    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        phone=data.phone,
        address=data.address,
        role=UserRole.customer,
        is_active=True,
    )
    db.add(user)
    await db.flush()   # lấy ID, không commit (commit do get_db dependency)
    await db.refresh(user)
    return user


async def update_user_profile(
    db: AsyncSession,
    user: User,
    data: UserUpdateProfile,
) -> User:
    """Cập nhật hồ sơ cá nhân. Kiểm tra current_password nếu đổi mật khẩu."""
    if data.new_password:
        if not data.current_password:
            raise ValueError("current_password is required to change password")
        if not verify_password(data.current_password, user.hashed_password):
            raise ValueError("current_password is incorrect")
        user.hashed_password = hash_password(data.new_password)

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.date_of_birth is not None:
        user.date_of_birth = data.date_of_birth
    if data.gender is not None:
        user.gender = data.gender
    if data.address is not None:
        user.address = data.address
    if data.ward is not None:
        user.ward = data.ward
    if data.district is not None:
        user.district = data.district
    if data.city is not None:
        user.city = data.city
    if data.postal_code is not None:
        user.postal_code = data.postal_code
    if data.address_note is not None:
        user.address_note = data.address_note

    await db.flush()
    await db.refresh(user)
    return user
