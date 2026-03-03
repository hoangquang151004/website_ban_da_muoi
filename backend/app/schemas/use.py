from datetime import datetime

from pydantic import BaseModel


class UseCreate(BaseModel):
    name: str
    icon: str
    color: str
    description: str | None = None
    is_active: bool = True


class UseUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None
    description: str | None = None
    is_active: bool | None = None


class UseResponse(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    description: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
