from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from .database import Base



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

    status = Column(Integer)                            # 상태 (0: 진행, 1: 완료, 2: 보류, 3: 폐기)

    customer_page = Column(String)                      # 고객페이지

    # property_id = Column(Integer, ForeignKey("properties.id"))
    # user_id = Column(Integer, ForeignKey("users.id"))
    # property_id = Column(Integer)
    # user_id = Column(Integer)

    # Relationships
    # user = relationship("User", back_populates="customers")


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
    filename = Column(String, index=True)
    description = Column(String, nullable=True)
    registration_date = Column(String, nullable=True)
    file_path = Column(String, unique=True)
    # data_category_id = Column(Integer, ForeignKey("categories.id"))
    data_category_id = Column(Integer)
    before_data_category_id = Column(Integer)



class DataCategoryModel(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(Integer)