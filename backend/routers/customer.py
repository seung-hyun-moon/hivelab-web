from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.schemas.customer import Customer, CustomerCreate, CustomerUpdate
from backend.db.models import CustomerModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class CustomerRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Customer, post_schema=CustomerCreate, put_schema=CustomerUpdate, model=CustomerModel)

    def create_item(self, item: CustomerCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: CustomerUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)
    
    def patch_item(self, item_id: int, item: CustomerUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)
