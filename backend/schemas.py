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
