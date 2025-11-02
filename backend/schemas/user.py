from pydantic import BaseModel, EmailStr
from typing import Optional

# 공통 사용자 속성
class UserBase(BaseModel):
    email: EmailStr
    name: str
    permission_level: str = 'STAFF'
    profile_picture_url: Optional[str] = None
    position: Optional[str] = None
    is_active: bool = True
    is_locked: bool = False

# 사용자 생성을 위한 스키마
class UserCreate(UserBase):
    pass

# 사용자 수정을 위한 스키마 (모든 필드는 선택적)
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    permission_level: Optional[str] = None
    profile_picture_url: Optional[str] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None
    is_locked: Optional[bool] = None

# API 응답을 위한 스키마
class User(UserBase):
    id: int

    class Config:
        from_attributes = True