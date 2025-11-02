from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.db.models import UserModel
from backend.schemas.user import User, UserCreate, UserUpdate
from backend.routers.basecurd import BaseCRUD


class UserRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=User, post_schema=UserCreate, put_schema=UserUpdate, model=UserModel)

    def create_item(self, item: UserCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: UserUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)

    def patch_item(self, item_id: int, item: UserUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)
