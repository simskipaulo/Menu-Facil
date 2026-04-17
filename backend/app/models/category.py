from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
    emoji = Column(String(10))
    order = Column("order", Integer, default=0)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
