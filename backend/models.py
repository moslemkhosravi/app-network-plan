from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

# جدول مشتریان
class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    contact_info = Column(String, nullable=True)

    # ارتباط یک-به-چند با جدول سایت‌ها
    sites = relationship("Site", back_populates="client")


# جدول سایت‌ها (مکان‌ها/دیتاسنترها)
class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String, nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id")) # اتصال به شناسه مشتری

    # ارتباط با جدول مشتریان
    client = relationship("Client", back_populates="sites")
