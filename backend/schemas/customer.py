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

    status : int = 0           # 상태 (0: 진행, 1: 완료, 2: 보류, 3: 폐기)

    customer_page : Optional[str] = None    # 고객페이지

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