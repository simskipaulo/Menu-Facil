from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import Tenant, User, UserRole
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantOut, CreateAdminRequest
from app.schemas.user import UserOut
from app.core.deps import require_super_admin, require_restaurant_admin
from app.core.auth import hash_password
from app.core.qrcode_gen import generate_qr_base64

class UpdateAdminRequest(BaseModel):
    email: EmailStr | None = None
    password: str | None = None

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("/", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    return db.query(Tenant).all()


@router.post("/", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
def create_tenant(body: TenantCreate, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    if db.query(Tenant).filter(Tenant.slug == body.slug).first():
        raise HTTPException(status_code=409, detail="Slug already in use")
    tenant = Tenant(**body.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/{tenant_id}", response_model=TenantOut)
def get_tenant(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.patch("/{tenant_id}", response_model=TenantOut)
def update_tenant(tenant_id: int, body: TenantUpdate, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(tenant, k, v)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    db.delete(tenant)
    db.commit()


@router.post("/{tenant_id}/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_restaurant_admin(
    tenant_id: int,
    body: CreateAdminRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already in use")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=UserRole.restaurant_admin,
        tenant_id=tenant_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{tenant_id}/users", response_model=list[UserOut])
def list_tenant_users(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return db.query(User).filter(User.tenant_id == tenant_id).all()


@router.patch("/{tenant_id}/users/{user_id}", response_model=UserOut)
def update_tenant_user(
    tenant_id: int,
    user_id: int,
    body: UpdateAdminRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    user = db.get(User, user_id)
    if not user or user.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    if body.email:
        existing = db.query(User).filter(User.email == body.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = body.email
    if body.password:
        user.password_hash = hash_password(body.password)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{tenant_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_tenant_user(
    tenant_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    user = db.get(User, user_id)
    if not user or user.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


@router.get("/{tenant_id}/qrcode")
def get_qr_code(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_restaurant_admin),
):
    if user.role == UserRole.restaurant_admin and user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Cannot access another tenant's QR code")
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if not tenant.qr_base_url:
        raise HTTPException(status_code=404, detail="QR code not generated yet")
    menu_url = f"{tenant.qr_base_url}/menu/{tenant.slug}"
    return {"qr_base64": generate_qr_base64(menu_url), "menu_url": menu_url}


@router.post("/{tenant_id}/qrcode")
def save_qr_code(
    tenant_id: int,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_restaurant_admin),
):
    if user.role == UserRole.restaurant_admin and user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Cannot access another tenant's QR code")
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    base_url = body.get("base_url", "").rstrip("/")
    if not base_url:
        raise HTTPException(status_code=422, detail="base_url is required")
    tenant.qr_base_url = base_url
    db.commit()
    db.refresh(tenant)
    menu_url = f"{base_url}/menu/{tenant.slug}"
    return {"qr_base64": generate_qr_base64(menu_url), "menu_url": menu_url}


@router.delete("/{tenant_id}/qrcode", status_code=204)
def delete_qr_code(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_restaurant_admin),
):
    if user.role == UserRole.restaurant_admin and user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Cannot access another tenant's QR code")
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.qr_base_url = None
    db.commit()
