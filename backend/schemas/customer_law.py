from pydantic import BaseModel
from typing import Optional, List


class CustomerLawBase(BaseModel):
    industry : Optional[str] = None         # 업종
    company_name : Optional[str] = None  # 회사명
    grade : Optional[str] = None          # 직급
    contact_info : Optional[str] = None     # 연락처
    personnel : Optional[str] = None         # 인원
    move_in_date : Optional[str] = None     # 입주시기

    notes : Optional[str] = None            # 진행사항
    special_notes : Optional[str] = None    # 특이사항
    edit_date : Optional[str] = None    # 수정 날짜
    counsel : Optional[str] = None         # 상담

    # 안보이는 것들
    create_date : Optional[str] = None  # 만든 날짜
    gender : Optional[str] = "남자"
    status : Optional[int] = 0           # 상태 (0: 진행, 1: 완료, 2: 보류, 3: 폐기, 4: 잠재)
    contact_date : Optional[str] = None     # 컨택일


class CustomerLawCreate(CustomerLawBase):
    pass


class CustomerLawUpdate(CustomerLawBase):
    pass


class CustomerLawStatusUpdate(BaseModel):
    ids: List[int]
    status: int


class CustomerLaw(CustomerLawBase):
    id: int

    class Config:
        from_attributes = True