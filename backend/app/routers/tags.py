from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Tag, User
from app.schemas.tag import TagCreate, TagOut
from app.core.deps import require_restaurant_admin

router = APIRouter(prefix="/tags", tags=["tags"])


def _get_tenant_id(user: User) -> int:
    if user.tenant_id is None:
        raise HTTPException(status_code=400, detail="No tenant associated with this user")
    return user.tenant_id


@router.get("/", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    return db.query(Tag).filter(Tag.tenant_id == _get_tenant_id(user)).all()


@router.post("/", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(body: TagCreate, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    tag = Tag(**body.model_dump(), tenant_id=_get_tenant_id(user))
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.patch("/{tag_id}", response_model=TagOut)
def update_tag(tag_id: int, body: TagCreate, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.tenant_id == _get_tenant_id(user)).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(tag, k, v)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: int, db: Session = Depends(get_db), user: User = Depends(require_restaurant_admin)):
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.tenant_id == _get_tenant_id(user)).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
