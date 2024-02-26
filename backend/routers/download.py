from pathlib import Path
import os

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.schemas.download import Data, DataCreate, DataUpdate
from backend.db.database import get_db
from backend.db.models import DataModel
from backend.routers.basecurd import BaseCRUD

BASE_DIR = Path('./APP_DATA')

class FileRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Data, post_schema=DataCreate, put_schema=DataUpdate, model=DataModel)
        self.files_directory = BASE_DIR / "uploaded_files"

    def create_item(self, file: UploadFile = File(...), description: str = Form(...), registration_date: str = Form(...), db: Session = Depends(get_db)):
        # 먼저 아이템을 데이터베이스에 저장합니다.
        print(description, registration_date)
        db_item = self.model(filename=file.filename, description=description, registration_date=registration_date)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        # 이제 파일을 저장합니다.
        file_location = self.files_directory / str(db_item.id) / file.filename
        print(file_location, description, registration_date)
        file_location.parent.mkdir(parents=True, exist_ok=True)
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())

        # 파일 경로를 데이터베이스에 업데이트합니다.
        db_item.file_path = str(file_location)
        db.commit()
        db.refresh(db_item)

        return db_item

    # 파일 다운로드 메소드 추가
    def get_item(self, item_id: int, db: Session = Depends(get_db)):
        db_item = db.query(self.model).filter(self.model.id == item_id).first()
        if db_item is None:
            raise HTTPException(status_code=404, detail="File not found")
        file_path = Path(db_item.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File does not exist")
        return FileResponse(path=db_item.file_path, filename=file_path.name, media_type='application/octet-stream')

    def delete_item(self, item_id: int, db: Session = Depends(get_db)):
        db_item = db.query(self.model).filter(self.model.id == item_id).first()
        if db_item is None:
            raise HTTPException(status_code=404, detail="File not found")
        file_path = Path(db_item.file_path)
        if file_path.exists():
            file_path.unlink()
        db.delete(db_item)
        db.commit()
        return {"detail": "File deleted"}