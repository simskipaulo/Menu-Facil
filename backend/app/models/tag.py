from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String(60), nullable=False)
    color = Column(String(7), default="#dcfce7")
    text_color = Column(String(7), default="#166534")
    emoji = Column(String(10))
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
