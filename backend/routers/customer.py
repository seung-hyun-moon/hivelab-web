from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.schemas.customer import Customer, CustomerCreate, CustomerUpdate, CustomerStatusUpdate
from backend.db.models import CustomerModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class CustomerRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Customer, post_schema=CustomerCreate, put_schema=CustomerUpdate, model=CustomerModel)
        self.router.add_api_route('/bulk_update_status', self.bulk_update_status, response_model=None, methods=['PATCH'])

    def create_item(self, item: CustomerCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: CustomerUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)
    
    def patch_item(self, item_id: int, item: CustomerUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)
    
    def bulk_update_status(self, items: CustomerStatusUpdate, db: Session = Depends(get_db)):
        print(items.model_dump().items())
        a = items.model_dump().items()
        for id in a["ids"]:
            customer = db.query(CustomerModel).filter(CustomerModel.id == id).first()
            if customer:
                customer.status = a["status"]
                db.commit()
            else:
                raise HTTPException(status_code=404, detail=f"Customer with id {id} not found")
