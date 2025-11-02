from pydantic import BaseModel
from typing import Optional, List

class CustomerBase(BaseModel):
    # category: str
    # id: int
    importance : Optional[str] = None       # 중요도
    contact_date : Optional[str] = None     # 컨택일
    move_in_date : Optional[str] = None     # 입주시기
    industry : Optional[str] = None         # 업종
    contact_info : Optional[str] = None     # 연락처
    notes : Optional[str] = None            # 비고

    contact_person : Optional[str] = None   # 컨택
    head : Optional[str] = None             # 정
    deputy : Optional[str] = None           # 부

    status : Optional[int] = 0           # 상태 (0: 진행, 1: 완료, 2: 보류, 3: 폐기, 4: 잠재)

    edit_date : Optional[str] = None    # 수정 날짜
    create_date : Optional[str] = None  # 만든 날짜
    marketing : Optional[str] = None    # 마케팅

    company_name : Optional[str] = None
    gender : Optional[str] = "남자"
    price : Optional[str] = None
    area : Optional[str] = None
    location : Optional[str] = None
    special_notes : Optional[str] = None

    creator: Optional[str] = None  # 만든이

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    pass

class CustomerStatusUpdate(BaseModel):
    ids: List[int]
    status: int

class Customer(CustomerBase):
    id: int

    class Config:
        from_attributes = True