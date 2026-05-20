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

# جدول رک‌ها
class Rack(Base):
    __tablename__ = "racks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    size_u = Column(Integer) # سایز رک مثلا 42U
    site_id = Column(Integer, ForeignKey("sites.id"))

    site = relationship("Site", backref="racks")
    devices = relationship("Device", back_populates="rack")


# جدول تجهیزات (سوییچ، سرور، پچ‌پنل و ...)
class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    device_type = Column(String) # نوع دستگاه (switch, server, patch_panel)
    rack_id = Column(Integer, ForeignKey("racks.id"))
    start_u = Column(Integer, nullable=True) # نصب شده از یونیت شماره X
    end_u = Column(Integer, nullable=True)   # تا یونیت شماره Y

    rack = relationship("Rack", back_populates="devices")
    ports = relationship("Port", back_populates="device")


# جدول پورت‌ها (مهم‌ترین بخش برای کابل‌کشی و IP)
class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, index=True)
    port_number = Column(String, index=True) # مثلا Fa0/1 یا شماره 1
    device_id = Column(Integer, ForeignKey("devices.id"))
    vlan = Column(String, nullable=True) # شماره ویلن
    ip_address = Column(String, nullable=True) # آی‌پی پورت
    cable_tag = Column(String, nullable=True) # لیبل یا تگ کابل
    description = Column(String, nullable=True) # کامنت پورت
    
    # این خط جادویی مشخص می‌کند این پورت به کدام پورت دیگر وصل شده است (کابل‌کشی فیزیکی)
    connected_to_id = Column(Integer, ForeignKey("ports.id"), nullable=True)

    device = relationship("Device", back_populates="ports")
    connected_to = relationship("Port", remote_side=[id], backref="connected_from")
