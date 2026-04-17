from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MenuItem, Tag, User, Category
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemOut
from app.core.deps import require_restaurant_admin

router = APIRouter(prefix="/menu-items", tags=["menu-items"])


def _get_tenant_id(user: User) -> int:
    if user.tenant_id is None:
        raise HTTPException(status_code=400, detail="No tenant associated with this user")
    return user.tenant_id


def _resolve_tags(tag_ids: list[int], tenant_id: int, db: Session) -> list[Tag]:
    unique_ids = list(set(tag_ids))
    if not unique_ids:
        return []
    tags = db.query(Tag).filter(Tag.id.in_(unique_ids), Tag.tenant_id == tenant_id).all()
    if len(tags) != len(unique_ids):
        raise HTTPException(status_code=400, detail="One or more tags not found or do not belong to this tenant")
    return tags


def _validate_category(category_id: int, tenant_id: int, db: Session) -> None:
    category = db.query(Category).filter(Category.id == category_id, Category.tenant_id == tenant_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category not found or does not belong to this tenant")


@router.get("/", response_model=list[MenuItemOut])
def list_items(db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    return db.query(MenuItem).filter(MenuItem.tenant_id == _get_tenant_id(user)).all()


@router.post("/", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
def create_item(body: MenuItemCreate, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    tenant_id = _get_tenant_id(user)
    _validate_category(body.category_id, tenant_id, db)
    tags = _resolve_tags(body.tag_ids, tenant_id, db)
    item = MenuItem(**body.model_dump(exclude={"tag_ids"}), tenant_id=tenant_id, tags=tags)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{item_id}", response_model=MenuItemOut)
def get_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.tenant_id == _get_tenant_id(user)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{item_id}", response_model=MenuItemOut)
def update_item(item_id: int, body: MenuItemUpdate, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    tenant_id = _get_tenant_id(user)
    item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.tenant_id == tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    data = body.model_dump(exclude_none=True)
    if "tag_ids" in data:
        item.tags = _resolve_tags(data.pop("tag_ids"), tenant_id, db)
    if "category_id" in data:
        _validate_category(data["category_id"], tenant_id, db)
    for k, v in data.items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.tenant_id == _get_tenant_id(user)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
