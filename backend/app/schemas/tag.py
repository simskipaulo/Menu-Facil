from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str
    color: str = "#dcfce7"
    text_color: str = "#166534"
    emoji: str | None = None


class TagOut(BaseModel):
    id: int
    name: str
    color: str
    text_color: str
    emoji: str | None
    tenant_id: int

    class Config:
        from_attributes = True
