from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.schemas.jjinbba import Jjinbba, JjinbbaCreate, JjinbbaUpdate
from backend.db.models import JjinbbaModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class JjinbbaRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Jjinbba, post_schema=JjinbbaCreate, put_schema=JjinbbaUpdate,
                         model=JjinbbaModel)

    def create_item(self, item: JjinbbaCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: JjinbbaUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)

    def patch_item(self, item_id: int, item: JjinbbaUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)