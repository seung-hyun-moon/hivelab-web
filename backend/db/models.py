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