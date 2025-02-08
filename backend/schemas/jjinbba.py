from pydantic import BaseModel
from typing import List, Optional


class JjinbbaBase(BaseModel):
    person: Optional[str] = "미정"
    description: Optional[str]
    numbers: List[int]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    is_completed: bool = False

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


class ImageRequest(BaseModel):
    zip_name: str
    image_urls: list  # 이미지 URL 리스트


class AllImagesRequest(BaseModel):
    zip_name: str                # 오늘 날짜 "YYYY.MM.DD" 등이 전달됨
    properties: List[ImageRequest]