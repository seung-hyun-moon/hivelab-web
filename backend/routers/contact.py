from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.schemas import contact
from backend.db import models
from backend.db.database import get_db

router = APIRouter()


@router.get("/", response_model=List[contact.Contact])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Contact).all()


@router.post("/", response_model=contact.Contact)
def create_contact(contact: contact.ContactCreate, db: Session = Depends(get_db)):
    db_contact = models.Contact(**contact.dict())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


@router.get("/{contact_id}", response_model=contact.Contact)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    return db.query(models.Contact).filter(models.Contact.id == contact_id).first()


@router.put("/{contact_id}", response_model=contact.Contact)
def update_contact(contact_id: int, contact: contact.ContactUpdate, db: Session = Depends(get_db)):
    db_contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if db_contact:
        for attr, value in contact.dict().items():
            setattr(db_contact, attr, value)
        db.commit()
        db.refresh(db_contact)
    return db_contact


@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    db_contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if db_contact:
        db.delete(db_contact)
        db.commit()
    return {"message": "Contact deleted"}
