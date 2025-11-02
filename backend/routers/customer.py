from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import status

from backend.schemas.customer import Customer, CustomerCreate, CustomerUpdate, CustomerStatusUpdate
from backend.db.models import CustomerModel, UserModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD
from backend.routers.auth import AuthHandler


class CustomerRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Customer, post_schema=CustomerCreate, put_schema=CustomerUpdate,
                         model=CustomerModel)
        self.router.add_api_route('/bulk_update_status', self.bulk_update_status, response_model=None,
                                  methods=['PATCH'])

    @staticmethod
    def is_manager_or_admin(user: UserModel) -> bool:
        """관리자 권한 확인"""
        return user.permission_level in ("MANAGER", "ADMIN")

    def get_items(self,
                  db: Session = Depends(get_db),
                  current_user: UserModel = Depends(AuthHandler.get_current_user)):
        """
        권한별 고객 목록 조회
        - STAFF: 본인이 만든 것(creator) + 공개된 것(is_public=True)만 조회
        - MANAGER/ADMIN: 모든 데이터 조회
        """
        if self.is_manager_or_admin(current_user):
            return db.query(CustomerModel).all()

        # STAFF: 공개이거나 본인 생성만
        return db.query(CustomerModel).filter(
            or_(
                CustomerModel.is_public == True,
                CustomerModel.creator == current_user.email
            )
        ).all()

    def get_item(self,
                 item_id: int,
                 db: Session = Depends(get_db),
                 current_user: UserModel = Depends(AuthHandler.get_current_user)):
        """
        권한별 개별 고객 조회
        - STAFF: 본인이 만든 것 + 공개된 것만 조회
        - MANAGER/ADMIN: 모든 데이터 조회
        """
        item = db.query(CustomerModel).filter(CustomerModel.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        if self.is_manager_or_admin(current_user):
            return item

        # STAFF: 공개이거나 본인 생성만 접근
        if item.is_public or item.creator == current_user.email:
            return item

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="권한이 없습니다.")

    def create_item(self,
                    item: CustomerCreate,
                    db: Session = Depends(get_db),
                    current_user: UserModel = Depends(AuthHandler.get_current_user)):
        return super().create_item(item=item, db=db)

    def update_item(self,
                    item_id: int,
                    item: CustomerUpdate,
                    db: Session = Depends(get_db),
                    current_user: UserModel = Depends(AuthHandler.get_current_user)):
        """
        권한별 고객 수정
        - STAFF: 본인이 만든 것만 수정 가능
        - MANAGER/ADMIN: 모든 데이터 수정 가능
        """
        db_item = db.query(CustomerModel).filter(CustomerModel.id == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")

        if not self.is_manager_or_admin(current_user):
            # STAFF: 본인 소유만 수정
            if db_item.creator != current_user.email:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="본인이 생성한 항목만 수정할 수 있습니다."
                )

        for k, v in item.model_dump().items():
            setattr(db_item, k, v)
        db.commit()
        db.refresh(db_item)
        return db_item

    def patch_item(self,
                   item_id: int,
                   item: CustomerUpdate,
                   db: Session = Depends(get_db),
                   current_user: UserModel = Depends(AuthHandler.get_current_user)):
        """
        권한별 고객 부분 수정
        - STAFF: 본인이 만든 것만 수정 가능
        - MANAGER/ADMIN: 모든 데이터 수정 가능
        """
        db_item = db.query(CustomerModel).filter(CustomerModel.id == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")

        if not self.is_manager_or_admin(current_user):
            if db_item.creator != current_user.email:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="본인이 생성한 항목만 수정할 수 있습니다."
                )

        for k, v in item.model_dump(exclude_unset=True).items():
            setattr(db_item, k, v)
        db.commit()
        db.refresh(db_item)
        return db_item

    def delete_item(self,
                    item_id: int,
                    db: Session = Depends(get_db),
                    current_user: UserModel = Depends(AuthHandler.get_current_user)):
        """
        권한별 고객 삭제
        - STAFF: 본인이 만든 것만 삭제 가능
        - MANAGER/ADMIN: 모든 데이터 삭제 가능
        """
        db_item = db.query(CustomerModel).filter(CustomerModel.id == item_id).first()
        if not db_item:
            return {"message": "Item deleted"}  # idempotent

        if not self.is_manager_or_admin(current_user):
            if db_item.creator != current_user.email:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="본인이 생성한 항목만 삭제할 수 있습니다."
                )

        db.delete(db_item)
        db.commit()
        return {"message": "Item deleted"}

    def bulk_update_status(self,
                           items: CustomerStatusUpdate,
                           db: Session = Depends(get_db),
                           current_user: UserModel = Depends(AuthHandler.get_current_user)):
        """
        권한별 일괄 상태 업데이트
        - STAFF: 본인이 만든 것만 수정 가능
        - MANAGER/ADMIN: 모든 데이터 수정 가능
        """
        data = items.model_dump()
        ids = data["ids"]
        new_status = data["status"]

        for customer_id in ids:
            customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
            if not customer:
                raise HTTPException(
                    status_code=404,
                    detail=f"Customer with id {customer_id} not found"
                )

            # STAFF 권한 체크
            if not self.is_manager_or_admin(current_user):
                if customer.creator != current_user.email:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Customer {customer_id}에 대한 권한이 없습니다."
                    )

            customer.status = new_status
            db.commit()
            db.refresh(customer)

        return {"message": "Status updated successfully", "updated_count": len(ids)}