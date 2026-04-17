from pydantic import BaseModel, ConfigDict, EmailStr


class TenantCreate(BaseModel):
    name: str
    slug: str
    logo_url: str | None = None
    primary_color: str = "#e63946"
    opening_hours: str | None = None


class TenantUpdate(BaseModel):
    name: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    opening_hours: str | None = None
    is_active: bool | None = None


class TenantOut(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: str | None
    primary_color: str
    opening_hours: str | None
    is_active: bool
    qr_base_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CreateAdminRequest(BaseModel):
    email: EmailStr
    password: str
