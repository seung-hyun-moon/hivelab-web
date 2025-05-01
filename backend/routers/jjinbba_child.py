from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.schemas.jjinbba import JjinbbaChild, JjinbbaChildCreate, JjinbbaChildUpdate, NumbersPayload
from backend.db.models import JjinbbaChildModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class JjinbbaChildRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=JjinbbaChild, post_schema=JjinbbaChildCreate, put_schema=JjinbbaChildUpdate,
                         model=JjinbbaChildModel)

        # Add custom routes
        self.router.add_api_route('/parent/{parent_id}', self.get_by_parent, response_model=List[JjinbbaChild],
                                  methods=['GET'])
        self.router.add_api_route('/find/{parent_id}/{number}', self.find_by_parent_and_number, response_model=JjinbbaChild, methods=['GET'])

    def create_item(self, item: JjinbbaChildCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: JjinbbaChildUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)

    def patch_item(self, item_id: int, item: JjinbbaChildUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)

    def get_by_parent(self, parent_id: int, db: Session = Depends(get_db)):
        """Get all child items for a specific parent ID"""
        items = db.query(self.model).filter(self.model.parent_id == parent_id).all()
        return items

    def find_by_parent_and_number(self,
                                  parent_id: int,
                                  number: int,
                                  db: Session = Depends(get_db)):
        """Find a specific child item by parent_id and number"""
        item = db.query(self.model).filter(
            self.model.parent_id == parent_id,
            self.model.number == number
        ).first()

        if not item:
            raise HTTPException(status_code=404,
                                detail=f"Child item with parent_id={parent_id} and number={number} not found")

        return item