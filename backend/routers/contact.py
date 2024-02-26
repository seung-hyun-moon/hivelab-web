from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.schemas.contact import Contact, ContactCreate, ContactUpdate
from backend.db.models import ContactModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class ContactRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Contact, post_schema=ContactCreate, put_schema=ContactUpdate, model=ContactModel)

    def create_item(self, item: ContactCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: ContactUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)