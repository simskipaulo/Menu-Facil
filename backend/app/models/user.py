from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SAEnum
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    restaurant_admin = "restaurant_admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    role = Column(SAEnum(UserRole, name="userrole"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
