from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.schemas.tag import TagOut


class MenuItemCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    image_url: str | None = None
    is_available: bool = True
    is_featured: bool = False
    category_id: int
    tag_ids: list[int] = []


class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    image_url: str | None = None
    is_available: bool | None = None
    is_featured: bool | None = None
    category_id: int | None = None
    tag_ids: list[int] | None = None


class MenuItemOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    is_available: bool
    is_featured: bool
    category_id: int
    tenant_id: int
    tags: list[TagOut]

    model_config = ConfigDict(from_attributes=True)
