from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Type, TypeVar, Generic, List
from pydantic import BaseModel

from backend.db.database import get_db

# 제네릭 타입 변수 정의
TGet = TypeVar("TGet")
TCreate = TypeVar("TCreate")
TUpdate = TypeVar("TUpdate")


# TODO : create_item, update_item 상속 시 Schema Type 문제 해결
class BaseCRUD(Generic[TGet, TCreate, TUpdate]):
    def __init__(self, get_schema: Type[TGet], post_schema: Type[TCreate], put_schema: Type[TUpdate], model):
        self.get_schema = get_schema
        self.post_schema = post_schema
        self.put_schema = put_schema
        self.model = model
        self.router = APIRouter()
        self.register_routes()

    def register_routes(self):
        self.router.add_api_route("/", self.get_items, response_model=List[self.get_schema], methods=["GET"])
        self.router.add_api_route("/", self.create_item, response_model=self.get_schema, methods=["POST"])
        self.router.add_api_route("/{item_id}", self.get_item, response_model=self.get_schema, methods=["GET"])
        self.router.add_api_route("/{item_id}", self.update_item, response_model=self.get_schema, methods=["PUT"])
        self.router.add_api_route("/{item_id}", self.delete_item, methods=["DELETE"])
        self.router.add_api_route("/{item_id}", self.patch_item, response_model=self.get_schema, methods=["PATCH"])

    def get_items(self, db: Session = Depends(get_db)):
        return db.query(self.model).all()

    def get_item(self, item_id: int, db: Session = Depends(get_db)):
        item = db.query(self.model).filter(self.model.id == item_id).first()
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        return item

    def create_item(self, item: TCreate, db: Session = Depends(get_db)):
        db_item = self.model(**item.model_dump())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    def update_item(self, item_id: int, item: TUpdate, db: Session = Depends(get_db)):
        db_item = db.query(self.model).get(item_id)
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        for key, value in item.model_dump().items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item

    def delete_item(self, item_id: int, db: Session = Depends(get_db)):
        db_item = db.query(self.model).filter(self.model.id == item_id).first()
        if db_item:
            db.delete(db_item)
            db.commit()
        return {"message": "Item deleted"}
    
    def patch_item(self, item_id: int, item: TUpdate, db: Session = Depends(get_db)):
        db_item = db.query(self.model).get(item_id)
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        for key, value in item.model_dump().items():
            if value is not None:
                setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item