from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

    # Relationships
    # customers = relationship("Customer", back_populates="user")
    # properties = relationship("Property", back_populates="user")


class CustomerModel(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)  # 구분
    importance = Column(String)                         # 중요도
    contact_date = Column(String)                       # 컨택일
    move_in_date = Column(String)                       # 입주시기
    industry = Column(String)                           # 업종
    contact_info = Column(String)                       # 연락처
    notes = Column(String)                              # 비고

    contact_person = Column(String)                     # 컨택
    head = Column(String)                               # 정
    deputy = Column(String)                             # 부

    status = Column(Integer)                            # 상태 (0: 진행, 1: 완료, 2: 보류, 3: 폐기, 4: 잠재)

    # customer_page = Column(String)                    # 고객페이지
    edit_date = Column(String)                          # 수정 날짜
    create_date = Column(String)                        # 만든 날짜
    marketing = Column(String)                          # 마케팅

    company_name = Column(String)
    gender = Column(String)
    price = Column(String)
    area = Column(String)
    location = Column(String)
    special_notes = Column(String)


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    thumbnail_path = Column(String)
    imgs_path = Column(String)
    address = Column(String)
    year_built = Column(String)
    size = Column(String)
    usage = Column(String)
    building_name = Column(String)
    floor = Column(String)
    supply_area = Column(String)
    private_area = Column(String)
    deposit = Column(String)
    rent = Column(String)
    maintenance_fee = Column(String)
    details = Column(String)
    manager1 = Column(String)
    manager2 = Column(String)

    user_id = Column(Integer)
    # user_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    # user = relationship("User", back_populates="properties")


class ContactModel(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    address = Column(String)
    registration_date = Column(String)
    description = Column(String)

    # Define relationships if needed

class DataModel(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    filename = Column(String, index=True)
    description = Column(String, nullable=True)
    registration_date = Column(String, nullable=True)
    file_path = Column(String)
    # data_category_id = Column(Integer, ForeignKey("categories.id"))
    data_category_id = Column(Integer)
    before_data_category_id = Column(Integer)



class DataCategoryModel(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(Integer)


class JjinbbaChildModel(Base):
    __tablename__ = "jjinbba_child"

    id = Column(Integer, primary_key=True, index=True)  # 자식의 고유 아이디
    parent_id = Column(Integer, ForeignKey("jjinbba.id"), nullable=False)  # 부모(JjinbbaModel)의 아이디와 연결

    number = Column(Integer)

    # 건물 기본 정보
    address = Column(String, comment="주소")  # finalAddress
    building_name = Column(String, comment="건물명")  # bldNm
    floor = Column(String, comment="층")  # floorInfo (첫번째 값 + "층")

    # 금액 관련 (이미 formatNumber/convertToKoreanUnit 처리된 문자열)
    deposit = Column(String, comment="보증금")  # warrantPrc -> "만"
    rent = Column(String, comment="임대료")  # rentPrc -> "만"
    management_fee = Column(String, comment="관리비")  # mgmtCost -> "만"
    rent_and_mgmt = Column(String, comment="임+관")  # rent와 management_fee의 합산 결과
    rate = Column(String, comment="이율") # 이율
    noc = Column(String, comment="NOC")
    rf = Column(String, comment="RF")

    # 기타 건물 정보
    exclusive_area = Column(String, comment="전용면적")  # (supplySpace * 0.3025 * 0.8) + "평"
    elevator = Column(String, comment="엘베")  # (rideUseElvtCnt + emgenUseElvtCnt) + "대"
    parking = Column(String, comment="주차")  # "Y"이면 "1", 아니면 "0"
    heating = Column(String, comment="냉난방")  # "중앙" 또는 "개별"
    restroom = Column(String, comment="화장실")  # 고정값 "외부 분리"

    lease_area = Column(String, comment="임대면적")  # supplySpace * 0.3025 + "평"
    use = Column(String, comment="용도")
    usage_approval_date = Column(String, comment="사용승인일")  # useAprDay를 formatKoreaDate로 변환한 값
    scale = Column(String, comment="규모")  # `지{ugrndFlrCnt}층 / {grndFlrCnt}층`
    direction = Column(String, comment="방향")  # buildingData.articleAddition.direction
    land_area = Column(String, comment="대지면적")  # platArea * 0.3025 + "평"
    building_area = Column(String, comment="건축면적")
    total_area = Column(String, comment="연면적")  # totArea * 0.3025 + "평"
    main_structure = Column(String, comment="주구조")  # etcStrct
    building_coverage = Column(String, comment="건폐율")  # bcRat + "%"
    floor_area_ratio = Column(String, comment="용적률")  # vlRat + "%"
    land_price = Column(String, comment="개별공시지가")

    feature = Column(String, comment="특징")  # buildingData.articleAddition.articleFeatureDesc
    note = Column(String, comment="특이사항")

    template = Column(String, comment="템플릿")
    img_urls = Column(JSON, default=list)
    rocation_url = Column(String, comment="위치정보")

    latitude = Column(String, comment="위도")
    longitude = Column(String, comment="경도")

    # 부모와의 관계 설정 (부모 모델에서 children 속성도 함께 정의하면 양방향 관계 사용 가능)
    parent = relationship("JjinbbaModel", back_populates="children")

class JjinbbaModel(Base):
    __tablename__ = "jjinbba"

    id = Column(Integer, primary_key=True, index=True)
    person = Column(String, nullable=True)
    customer = Column(String, nullable=True)
    # numbers 컬럼은 정수 리스트를 저장 (예: [12345, 67890, 11223])
    numbers = Column(JSON, nullable=False, default=list)

    description = Column(String, nullable=True)

    created_at = Column(String)
    updated_at = Column(String)

    is_completed = Column(Boolean, default=True)

    checkboxes = Column(JSON, nullable=True, default=dict)
    first_number = Column(Integer, nullable=True)
    region_info = Column(String, nullable=True)
    templates = Column(JSON, nullable=True, default=dict)

    children = relationship("JjinbbaChildModel", back_populates="parent", cascade="all, delete")

class EventModel(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    calendarId = Column(String, nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    isAllday = Column(Boolean, nullable=False)
    start = Column(String, nullable=False)
    end = Column(String, nullable=False)
    goingDuration = Column(Integer, nullable=True)
    comingDuration = Column(Integer, nullable=True)
    location = Column(String, nullable=True)
    attendees = Column(JSON, nullable=True)
    category = Column(String, nullable=True)
    dueDateClass = Column(String, nullable=True)
    recurrenceRule = Column(String, nullable=True)
    state = Column(String, nullable=False)
    isVisible = Column(Boolean, nullable=True)
    isPending = Column(Boolean, nullable=True)
    isFocused = Column(Boolean, nullable=True)
    isReadOnly = Column(Boolean, nullable=True)
    isPrivate = Column(Boolean, nullable=False)
    color = Column(String, nullable=True)
    backgroundColor = Column(String, nullable=True)
    dragBackgroundColor = Column(String, nullable=True)
    borderColor = Column(String, nullable=True)
    customStyle = Column(JSON, nullable=True)
    raw = Column(JSON, nullable=True)