from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.schemas.event import Event, EventCreate, EventUpdate
from backend.db.models import EventModel
from backend.routers.basecurd import BaseCRUD
import dateutil.parser


class EventRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Event, post_schema=EventCreate, put_schema=EventUpdate, model=EventModel)

    @staticmethod
    def parse_datetime(value):
        if isinstance(value, str):
            return dateutil.parser.isoparse(value)
        return value

    def get_item(self, item_id: str, db: Session = Depends(get_db)):
        item = db.query(self.model).filter(self.model.id == item_id).first()
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        return item

    def create_item(self, item: EventCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def delete_item(self, item_id: str, db: Session = Depends(get_db)):
        db_item = db.query(self.model).filter(self.model.id == item_id).first()
        if db_item:
            db.delete(db_item)
            db.commit()
        return {"message": "Item deleted"}

    def patch_item(self, item_id: str, item: EventUpdate, db: Session = Depends(get_db)):
        db_item = db.query(self.model).get(item_id)
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")
        for key, value in item.model_dump().items():
            if value is not None:
                setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item
