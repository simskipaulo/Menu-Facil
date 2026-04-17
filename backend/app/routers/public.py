from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Tenant, Category, MenuItem
from app.schemas.tenant import TenantOut
from app.schemas.category import CategoryOut
from app.schemas.menu_item import MenuItemOut

router = APIRouter(prefix="/public", tags=["public"])


class PublicMenuResponse(BaseModel):
    tenant: TenantOut
    categories: list[CategoryOut]
    items: list[MenuItemOut]


@router.get("/{slug}", response_model=PublicMenuResponse)
def get_public_menu(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.slug == slug, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    categories = (
        db.query(Category)
        .filter(Category.tenant_id == tenant.id)
        .order_by(Category.order)
        .all()
    )
    items = (
        db.query(MenuItem)
        .filter(MenuItem.tenant_id == tenant.id, MenuItem.is_available == True)
        .all()
    )
    return PublicMenuResponse(tenant=tenant, categories=categories, items=items)
