from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    logo_url = Column(String(500))
    primary_color = Column(String(7), default="#e63946")
    opening_hours = Column(String(200))
    is_active = Column(Boolean, default=True)
