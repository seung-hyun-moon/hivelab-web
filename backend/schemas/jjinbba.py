from pydantic import BaseModel
from typing import List, Dict, Optional


class JjinbbaBase(BaseModel):
    person: Optional[str] = None
    customer: Optional[str] = None
    description: Optional[str] = None
    numbers: Optional[List[int]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    is_completed: Optional[bool] = False

    checkboxes: Optional[Dict[str, bool]] = None
    first_number: Optional[int] = 1
    region_info: Optional[str] = None
    templates: Optional[Dict[str, str]] = None

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


class JjinbbaChildBase(BaseModel):
    parent_id: int  # 부모와 연결하기 위한 아이디
    number: Optional[int] = None

    address: Optional[str] = None
    building_name: Optional[str] = None
    floor: Optional[str] = None
    deposit: Optional[str] = None
    rent: Optional[str] = None
    management_fee: Optional[str] = None
    rent_and_mgmt: Optional[str] = None
    lease_area: Optional[str] = None
    exclusive_area: Optional[str] = None
    elevator: Optional[str] = None
    parking: Optional[str] = None
    heating: Optional[str] = None
    restroom: Optional[str] = None
    direction: Optional[str] = None
    feature: Optional[str] = None
    usage_approval_date: Optional[str] = None
    land_area: Optional[str] = None
    total_area: Optional[str] = None
    scale: Optional[str] = None
    main_structure: Optional[str] = None
    building_coverage: Optional[str] = None
    floor_area_ratio: Optional[str] = None

    template: Optional[str] = None
    img_urls: Optional[List[str]] = None

class Config:
        from_attributes = True

# 자식 생성용 스키마
class JjinbbaChildCreate(JjinbbaChildBase):
    pass

# 자식 업데이트용 스키마
class JjinbbaChildUpdate(JjinbbaChildBase):
    pass

# DB 조회 결과를 위한 자식 스키마 (id 포함)
class JjinbbaChild(JjinbbaChildBase):
    id: int

    class Config:
        from_attributes = True