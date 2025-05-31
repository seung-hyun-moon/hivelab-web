from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.schemas.customer_law import CustomerLaw, CustomerLawCreate, CustomerLawUpdate, CustomerLawStatusUpdate
from backend.db.models import CustomerLawModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD


class CustomerLawRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=CustomerLaw, post_schema=CustomerLawCreate, put_schema=CustomerLawUpdate, model=CustomerLawModel)
        self.router.add_api_route('/bulk_update_status', self.bulk_update_status, response_model=None, methods=['PATCH'])

    def create_item(self, item: CustomerLawCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: CustomerLawUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)
    
    def patch_item(self, item_id: int, item: CustomerLawUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)
    
    def bulk_update_status(self, items: CustomerLawStatusUpdate, db: Session = Depends(get_db)):
        print(items.model_dump().items())
        a = items.model_dump().items()
        for id in a["ids"]:
            customer = db.query(CustomerLawModel).filter(CustomerLawModel.id == id).first()
            if customer:
                customer.status = a["status"]
                db.commit()
                db.refresh(customer)
            else:
                raise HTTPException(status_code=404, detail=f"Customer with id {id} not found")
