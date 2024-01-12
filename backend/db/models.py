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

    id = Column(Integer, primary_key=True, index=True)
    # category = Column(String)
    importance = Column(String)
    move_in_date = Column(String)
    industry = Column(String)
    contact_info = Column(String)
    deposit = Column(String)
    rent = Column(String)
    size = Column(String)
    sector = Column(String)
    notes = Column(String)

    contact_person1 = Column(String)
    contact_person2 = Column(String)

    handling_person1 = Column(String)
    handling_person2 = Column(String)

    talk_person1 = Column(String)
    talk_person2 = Column(String)

    # property_id = Column(Integer, ForeignKey("properties.id"))
    # user_id = Column(Integer, ForeignKey("users.id"))
    property_id = Column(Integer)
    user_id = Column(Integer)

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
