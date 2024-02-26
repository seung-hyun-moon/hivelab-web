from pathlib import Path
import os

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
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

    def create_item(self, file: UploadFile = File(...), description: str = "", registration_date: str = "", db: Session = Depends(get_db)):
        file_location = self.files_directory / file.filename
        file_location.parent.mkdir(parents=True, exist_ok=True)
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
        db_item = self.model(filename=file.filename, file_path=str(file_location), description=description, registration_date=registration_date)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    # 파일 다운로드 메소드 추가
    def download_item(self, item_id: int, db: Session = Depends(get_db)):
        db_item = db.query(self.model).filter(self.model.id == item_id).first()
        if db_item is None:
            raise HTTPException(status_code=404, detail="File not found")
        file_path = Path(db_item.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File does not exist")
        return FileResponse(path=db_item.file_path, filename=file_path.name, media_type='application/octet-stream')

    # 라우트 등록 메소드에 다운로드 라우트 추가
    def register_routes(self):
        super().register_routes()  # 기본 CRUD 라우트 등록
        self.router.add_api_route("/download/{item_id}", self.download_item, methods=["GET"])
