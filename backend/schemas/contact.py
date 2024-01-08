from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ContactBase(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    registration_date: Optional[str] = None
    description: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ContactBase):
    pass


class Contact(ContactBase):
    id: int

    class Config:
        from_attributes = True