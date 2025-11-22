import logging
from functools import wraps
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Type, TypeVar, Generic, List
from pydantic import BaseModel

from backend.db.database import get_db

# 제네릭 타입 변수 정의
TGet = TypeVar("TGet")
TCreate = TypeVar("TCreate")
TUpdate = TypeVar("TUpdate")

logging.basicConfig(
    filename=r'D:\\db_customer_log.txt',
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)


# 로깅 데코레이터
def log_db_activity(action: str):
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, request: Request = None, **kwargs):
            result = func(self, *args, **kwargs)
            client_ip = request.client.host if request else "Unknown"
            # 로그를 남길 내용 준비
            item = kwargs.get("item", None)
            item_id = kwargs.get("item_id", None)
            if item:
                logging.info(f"{client_ip} {action.upper()} ITEM: {item.dict() if hasattr(item, 'dict') else item}")
            if item_id:
                logging.info(f"{client_ip} {action.upper()} ITEM ID: {item_id}")

            return result

        return wrapper

    return decorator

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
        self.router.add_api_route("/{item_id:int}", self.get_item, response_model=self.get_schema, methods=["GET"])
        self.router.add_api_route("/{item_id:int}", self.update_item, response_model=self.get_schema, methods=["PUT"])
        self.router.add_api_route("/{item_id:int}", self.delete_item, methods=["DELETE"])
        self.router.add_api_route("/{item_id:int}", self.patch_item, response_model=self.get_schema, methods=["PATCH"])

    def get_items(self, db: Session = Depends(get_db)):
        return db.query(self.model).all()

    def get_item(self, item_id: int, db: Session = Depends(get_db)):
        item = db.query(self.model).filter(self.model.id == item_id).first()
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        return item

    @log_db_activity("create")
    def create_item(self, item: TCreate, db: Session = Depends(get_db), request: Request = None):
        db_item = self.model(**item.model_dump())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    @log_db_activity("update")
    def update_item(self, item_id: int, item: TUpdate, db: Session = Depends(get_db), request: Request = None):
        db_item = db.query(self.model).get(item_id)
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        for key, value in item.model_dump().items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item

    @log_db_activity("delete")
    def delete_item(self, item_id: int, db: Session = Depends(get_db), request: Request = None):
        db_item = db.query(self.model).filter(self.model.id == item_id).first()
        if db_item:
            db.delete(db_item)
            db.commit()
        return {"message": "Item deleted"}

    @log_db_activity("patch")
    def patch_item(self, item_id: int, item: TUpdate, db: Session = Depends(get_db), request: Request = None):
        db_item = db.query(self.model).get(item_id)
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        for key, value in item.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item