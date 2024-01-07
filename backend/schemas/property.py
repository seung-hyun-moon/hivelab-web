from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from fastapi import UploadFile
from typing import List

class PropertyBase(BaseModel):
    thumbnail_path: Optional[str] = None
    imgs_path: Optional[str] = None
    address: str
    year_built: Optional[str] = None
    size: Optional[str] = None
    usage: Optional[str] = None
    building_name: Optional[str] = None
    floor: Optional[str] = None
    supply_area: Optional[str] = None
    private_area: Optional[str] = None
    deposit: Optional[str] = None
    rent: Optional[str] = None
    maintenance_fee: Optional[str] = None
    details: Optional[str] = None
    manager1: Optional[str] = None
    manager2: Optional[str] = None

class PropertyCreate(PropertyBase):
    thumbnail: Optional[UploadFile] = None
    imgs: Optional[List[UploadFile]] = None

class PropertyUpdate(PropertyBase):
    thumbnail: Optional[str] = None
    imgs: Optional[str] = None

class Property(PropertyBase):
    id: int

    class Config:
        from_attributes = True