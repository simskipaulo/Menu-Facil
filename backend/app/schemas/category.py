from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    emoji: str | None = None
    order: int = 0


class CategoryOut(BaseModel):
    id: int
    name: str
    emoji: str | None
    order: int
    tenant_id: int

    class Config:
        from_attributes = True
