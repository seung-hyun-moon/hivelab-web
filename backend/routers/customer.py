from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import status

from backend.schemas.customer import Customer, CustomerCreate, CustomerUpdate, CustomerStatusUpdate
from backend.db.models import CustomerModel, UserModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD
from backend.routers.auth import AuthHandler


class CustomerRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Customer, post_schema=CustomerCreate, put_schema=CustomerUpdate, model=CustomerModel)
        self.router.add_api_route('/prioritized', self.get_items_prioritized, methods=['GET'])
        self.router.add_api_route('/bulk_update_status', self.bulk_update_status, response_model=None, methods=['PATCH'])

    def _normalize_people_field(self, value: str | None) -> list[str]:
        if not value:
            return []
        for sep in [",", ";", "/", "|"]:
            value = value.replace(sep, "\n")
        return [t.strip() for t in value.splitlines() if t.strip()]

    def _is_my_po_pa(self, user_name: str, customer: CustomerModel) -> bool:
        head_tokens = self._normalize_people_field(customer.head)
        deputy_tokens = self._normalize_people_field(customer.deputy)
        tokens = head_tokens + deputy_tokens
        return user_name in tokens

    def get_items_prioritized(
        self,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        """
        - 모든 고객을 불러온 후
        - head 또는 deputy에 현재 유저 이름이 들어있는 고객만
        - edit_date DESC로 정렬해서 반환
        """

        my_name = (current_user.name or "").strip()
        if not my_name:
            return []  # 이름이 없으면 그냥 빈 리스트 반환

        # 1) 모든 고객 가져오기
        items: list[CustomerModel] = db.query(CustomerModel).all()

        # 2) head/deputy 문자열을 토큰 리스트로 변환
        def normalize_people_field(value: str | None) -> list[str]:
            if not value:
                return []
            # 콤마, 세미콜론, 슬래시 등을 줄바꿈으로 통일
            for sep in [",", ";", "/", "|"]:
                value = value.replace(sep, "\n")
            return [t.strip() for t in value.splitlines() if t.strip()]

        def is_my_po_pa(item: CustomerModel) -> bool:
            head_tokens = normalize_people_field(item.head)
            deputy_tokens = normalize_people_field(item.deputy)
            tokens = head_tokens + deputy_tokens
            # 정확히 이름이 일치하는 경우만
            return my_name in tokens

        # 3) 내 이름이 들어간 항목만 필터링
        my_items = [i for i in items if is_my_po_pa(i)]

        # 4) edit_date DESC 정렬
        my_items.sort(key=lambda i: i.edit_date or "", reverse=True)

        # 5) can_edit 포함해서 반환
        response_items: list[Customer] = []
        for item in my_items:
            can_edit = self._can_edit(current_user, item)
            # SQLAlchemy 내부 필드 제외하고 컬럼만 dict로
            data = {col.name: getattr(item, col.name) for col in item.__table__.columns}
            data["can_edit"] = can_edit
            response_items.append(Customer(**data))

        return response_items

    @staticmethod
    def is_manager_or_admin(user: UserModel) -> bool:
        """관리자 권한 확인"""
        return user.permission_level in ("MANAGER", "ADMIN")

    @staticmethod
    def _names_by_permission(db: Session, levels: tuple[str, ...]) -> list[str]:
        rows = db.query(UserModel.name).filter(
            UserModel.permission_level.in_(levels),
            UserModel.is_active == True
        ).all()
        return [name for (name,) in rows]

    def _can_edit(self, current_user: UserModel, customer: CustomerModel) -> bool:
        # 관리자라면 항상 가능
        if current_user.permission_level in ("MANAGER", "ADMIN"):
            return True

        user_name = (current_user.name or "").strip()
        if not user_name:
            return False

        # STAFF: creator 이거나 head/deputy 에 이름이 포함된 경우 가능
        if customer.creator == user_name:
            return True

        if self._is_my_po_pa(user_name, customer):
            return True

        return False

    def get_items(
            self,
            db: Session = Depends(get_db),
            current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        if self.is_manager_or_admin(current_user):
            items = db.query(CustomerModel).all()
        else:
            # STAFF 읽기 규칙에 따라 항목 쿼리
            admin_names = self._names_by_permission(db, ("MANAGER", "ADMIN"))
            staff_names = self._names_by_permission(db, ("STAFF",))

            items = db.query(CustomerModel).filter(
                or_(
                    CustomerModel.creator == current_user.name,
                    CustomerModel.creator.in_(staff_names),
                    and_(
                        CustomerModel.is_public == True,
                        CustomerModel.creator.in_(admin_names),
                    )
                )
            ).all()

            # 각 항목에 can_edit 정보를 추가하여 응답 스키마로 변환
        response_items = []
        for item in items:
            can_edit = self._can_edit(current_user, item)

            # Customer 스키마로 변환 (can_edit 추가 필요)
            # Customer 스키마에 can_edit 필드가 추가되었다고 가정하고 코드를 작성합니다.
            customer_data = item.__dict__
            customer_data['can_edit'] = can_edit
            response_items.append(Customer(**customer_data))

        return response_items

    def get_item(
            self,
            item_id: int,
            db: Session = Depends(get_db),
            current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        item = db.query(CustomerModel).filter(CustomerModel.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        if self.is_manager_or_admin(current_user):
            return item

        # STAFF 읽기 허용 조건과 동일 판정
        if item.creator == current_user.name:
            return item

        staff_names = self._names_by_permission(db, ("STAFF",))
        if item.creator in staff_names:
            return item

        admin_names = self._names_by_permission(db, ("MANAGER", "ADMIN"))
        if item.is_public and item.creator in admin_names:
            return item

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="권한이 없습니다.")

    def create_item(self,
                    item: CustomerCreate,
                    db: Session = Depends(get_db),
                    current_user: UserModel = Depends(AuthHandler.get_current_user)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: CustomerUpdate,
                    db: Session = Depends(get_db),
                    current_user: UserModel = Depends(AuthHandler.get_current_user)):

        db_item = db.query(CustomerModel).filter(CustomerModel.id == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")

        if not self._can_edit(current_user, db_item):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="수정 권한이 없습니다."
            )

        for k, v in item.model_dump().items():
            setattr(db_item, k, v)
        db.commit()
        db.refresh(db_item)
        return db_item

    def patch_item(self, item_id: int, item: CustomerUpdate,
                   db: Session = Depends(get_db),
                   current_user: UserModel = Depends(AuthHandler.get_current_user)):

        db_item = db.query(CustomerModel).filter(CustomerModel.id == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")

        if not self._can_edit(current_user, db_item):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="수정 권한이 없습니다."
            )

        for k, v in item.model_dump(exclude_unset=True).items():
            setattr(db_item, k, v)
        db.commit()
        db.refresh(db_item)
        return db_item

    def delete_item(self, item_id: int,
                    db: Session = Depends(get_db),
                    current_user: UserModel = Depends(AuthHandler.get_current_user)):

        db_item = db.query(CustomerModel).filter(CustomerModel.id == item_id).first()
        if not db_item:
            return {"message": "Item deleted"}  # idempotent

        if not self._can_edit(current_user, db_item):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="삭제 권한이 없습니다."
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
                if customer.creator != current_user.name:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Customer {customer_id}에 대한 권한이 없습니다."
                    )

            customer.status = new_status
            db.commit()
            db.refresh(customer)

        return {"message": "Status updated successfully", "updated_count": len(ids)}