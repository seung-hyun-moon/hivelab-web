from pydantic import BaseModel
from typing import Optional

class CustomerBase(BaseModel):
    # category: str
    # id: int
    importance: Optional[str] = None
    move_in_date: Optional[str] = None
    industry: Optional[str] = None
    contact_info: Optional[str] = None
    deposit: Optional[str] = None
    rent: Optional[str] = None
    size: Optional[str] = None
    sector: Optional[str] = None
    notes: Optional[str] = None

    contact_person1: Optional[str] = None
    contact_person2: Optional[str] = None

    handling_person1: Optional[str] = None
    handling_person2: Optional[str] = None

    talk_person1: Optional[str] = None
    talk_person2: Optional[str] = None

    property_id: Optional[int] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "importance": "3",
                "move_in_date": "230723",
                "industry": "병원관리 사무실",
                "contact_info": "010-5653-5483",
                "deposit": "10,000",
                "rent": "1,000",
                "size": "100평 이상",
                "sector": "강남경찰서 어쩌구",
                "notes": "케이플라즈타워 인근 선호",
                "contact_person1": "노현정",
                "contact_person2": "",
                "handling_person1": "송재민",
                "handling_person2": "길민제",
                "talk_person1": "노현정",
                "talk_person2": "길민제"
            }
        }