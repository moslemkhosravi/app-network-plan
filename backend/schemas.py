from pydantic import BaseModel
from typing import Optional

# ساختار پایه اطلاعات مشتری
class ClientBase(BaseModel):
    name: str
    contact_info: Optional[str] = None

# ساختار برای زمان ثبت مشتری جدید (ورودی)
class ClientCreate(ClientBase):
    pass

# ساختار برای زمان نمایش مشتری به کاربر (خروجی که ID هم دارد)
class ClientResponse(ClientBase):
    id: int

    class Config:
        from_attributes = True

# ==========================================
# ساختار اطلاعات سایت‌ها (Sites)
# ==========================================
class SiteBase(BaseModel):
    name: str
    address: Optional[str] = None
    client_id: int  # هر سایت باید به یک مشتری وصل باشد

class SiteCreate(SiteBase):
    pass

class SiteResponse(SiteBase):
    id: int

    class Config:
        from_attributes = True

# ==========================================
# ساختار اطلاعات رک‌ها (Racks)
# ==========================================
class RackBase(BaseModel):
    name: str
    size_u: int      # سایز رک بر اساس یونیت (مثلا 42)
    site_id: int     # هر رک باید داخل یک سایت مشخص باشد

class RackCreate(RackBase):
    pass

class RackResponse(RackBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# ساختار اطلاعات تجهیزات (Devices)
# ==========================================
class DeviceBase(BaseModel):
    name: str
    device_type: str # مثلا switch, server, patch_panel
    rack_id: int
    start_u: Optional[int] = None # نصب شده از یونیت
    end_u: Optional[int] = None   # تا یونیت

class DeviceCreate(DeviceBase):
    pass

class DeviceResponse(DeviceBase):
    id: int

    class Config:
        from_attributes = True