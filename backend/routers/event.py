from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.schemas.event import Event, EventCreate, EventUpdate
from backend.db.models import EventModel
from backend.routers.basecurd import BaseCRUD


class EventRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Event, post_schema=EventCreate, put_schema=EventUpdate, model=EventModel)

    def create_item(self, item: EventCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: EventUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)