from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Tenant, User, UserRole
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantOut, CreateAdminRequest
from app.schemas.user import UserOut
from app.core.deps import require_super_admin, require_restaurant_admin
from app.core.auth import hash_password
from app.core.qrcode_gen import generate_qr_base64

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


@router.get("/{tenant_id}/qrcode")
def get_qr_code(
    tenant_id: int,
    base_url: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_restaurant_admin),
):
    # Restaurant admins can only get their own QR code
    if user.role == UserRole.restaurant_admin and user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Cannot access another tenant's QR code")
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    menu_url = f"{base_url}/menu/{tenant.slug}"
    qr_base64 = generate_qr_base64(menu_url)
    return {"qr_base64": qr_base64, "menu_url": menu_url}
