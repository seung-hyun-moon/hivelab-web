from pydantic import BaseModel
from typing import Optional

# 찐빠 정보 스키마
class JjinbbaBase(BaseModel):
    numbers: Optional[str] = None
    filename: Optional[str] = None
    description: Optional[str] = None
    registration_date: Optional[str] = None
    file_path: Optional[str] = None
    person: Optional[str] = "미정"
    status: Optional[int] = 0

    class Config:
        from_attributes = True


# 찐빠 생성 스키마
class JjinbbaCreate(JjinbbaBase):
    pass


# 찐빠 업데이트 스키마
class JjinbbaUpdate(JjinbbaBase):
    pass


class Jjinbba(JjinbbaBase):
    id: int

    class Config:
        from_attributes = True