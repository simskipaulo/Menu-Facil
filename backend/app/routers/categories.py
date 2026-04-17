from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Category, User
from app.schemas.category import CategoryCreate, CategoryOut
from app.core.deps import require_restaurant_admin

router = APIRouter(prefix="/categories", tags=["categories"])


def _get_tenant_id(user: User) -> int:
    if user.tenant_id is None:
        raise HTTPException(status_code=400, detail="No tenant associated with this user")
    return user.tenant_id


@router.get("/", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    return db.query(Category).filter(Category.tenant_id == _get_tenant_id(user)).order_by(Category.order).all()


@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryCreate, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    cat = Category(**body.model_dump(), tenant_id=_get_tenant_id(user))
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, body: CategoryCreate, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    cat = db.query(Category).filter(Category.id == category_id, Category.tenant_id == _get_tenant_id(user)).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    cat = db.query(Category).filter(Category.id == category_id, Category.tenant_id == _get_tenant_id(user)).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
