from pydantic import BaseModel
from typing import Optional

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

    customer_page : Optional[str] = None    # 고객페이지

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
                "importance": "A",
                "contact_date": "231117",
                "move_in_date": "",
                "industry": "헬스케어 | 김주연이사",
                "contact_info": "010-8844-9666",
                "notes": """
                    20,000/1,500 ㅣ 전용80평 ㅣ 주차2대 이상 ㅣ 신논현,언주,교대,강남,역삼,뱅뱅
                    ㄴ 옛날 소개받은 손님
                    ㄴ 당시에는 도보 5분거리 선호했음 7,8분거리 괜찮음
                    ㄴ 헬스장도 있고 건강식품도 판매하던 사무실로 기억함
                    ㄴ 주차, 카니발로 기억 (자주식 1대 기계식 1대) 희망했음
                    ㄴ 공유오피스 좀 쓰다가 옮기기로 했었음
                    ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
                    11월 21일 미팅
                    사무실 두개 합쳐서 확장이전 생각중
                    ㄴ 현재 사용하는곳도 인테리어 했음
                    ㄴ 직원 20~30명
                    ㄴ 사업 이것저것 많이함

                    70평대도 평수는 괜찮음
                    오늘 본것중에서는 미드타윤센터 2층 제일 마음에 듬
                    오히려 직원들이 강남역삼 별로 (사람 많아서)
                    양재천 쪽도 물건 있으면 ㄱㄱ

                    서초그랑자이 2억 600 (비슷한 금액대 아파트 말고 고급 빌라 있으면 알려달라)

                    장기전으로 가야할 것 같음
                    ㄴ 본인들 현재 사용하는 사무실도 보러오는 사람이 많이 없다고 함
                    ㄴ 주택 매물도 꾸준히 미팅은 하고 있는중
                """,
                "contact_person": "송재민",
                "head": "길민제",
                "deputy": "이경주",
                "customer_page": "",
            }
        }