from pydantic import BaseModel, ConfigDict, EmailStr
from app.models.user import UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: str
    role: UserRole
    tenant_id: int | None

    model_config = ConfigDict(from_attributes=True)
