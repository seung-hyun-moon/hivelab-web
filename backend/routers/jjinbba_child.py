from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.schemas.jjinbba import JjinbbaChild, JjinbbaChildCreate, JjinbbaChildUpdate
from backend.db.models import JjinbbaChildModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class JjinbbaChildRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=JjinbbaChild, post_schema=JjinbbaChildCreate, put_schema=JjinbbaChildUpdate, model=JjinbbaChildModel)

    def create_item(self, item: JjinbbaChildCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: JjinbbaChildUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)

    def patch_item(self, item_id: int, item: JjinbbaChildUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)