from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, HTTPException
from sqlalchemy.orm import Session

from backend.schemas.contact import Contact, ContactCreate, ContactUpdate
from backend.db.models import ContactModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class ContactRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Contact, post_schema=ContactCreate, put_schema=ContactUpdate, model=ContactModel)
        self.router.add_api_route("/upload", self.upload_excel_to_db, methods=["POST"])

    def create_item(self, item: ContactCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: ContactUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)

    def upload_excel_to_db(self, file: UploadFile, db: Session = Depends(get_db)):
        print(file.filename)
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(file.file, engine='openpyxl')
        elif file.filename.endswith('.xls'):
            df = pd.read_excel(file.file, engine='xlrd')
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        else:
            raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .xlsx or .xls file.")
        print(file.filename)

        required_columns = ['이름', '전화', '주소', '설명']
        if not all(column in df.columns for column in required_columns):
            raise HTTPException(status_code=400,
                                detail="Excel file must have the following headers: 이름, 전화, 주소, 설명")

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

            contact = self.model(name=name, phone=phone, address=address, registration_date=registration_date, description=description)
            db.add(contact)
        db.commit()
