from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, HTTPException
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


@router.post("/upload")
def upload_excel_to_db(file: UploadFile, db: Session = Depends(get_db)):
    print(file.filename)
    if file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
        df = pd.read_excel(file.file)
        print(file.filename)

        required_columns = ['이름', '전화', '주소', '설명']
        if not all(column in df.columns for column in required_columns):
            raise HTTPException(status_code=400, detail="Excel file must have the following headers: 이름, 전화, 주소, 설명")

        for _, row in df.iterrows():
            name = row['이름']
            phone = row['전화']
            address = row['주소']
            if '등록일' in df.columns and pd.notna(row['등록일']):
                # 문자열을 datetime 객체로 변환
                registration_date = pd.to_datetime(row['등록일']).strftime("%Y-%m-%d %H:%M:%S")
            else:
                registration_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            description = row['설명']

            contact = models.Contact(name=name, phone=phone, address=address, registration_date=registration_date, description=description)
            db.add(contact)
        db.commit()
    else:
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .xlsx or .xls file.")