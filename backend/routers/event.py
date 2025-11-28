from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from backend.db.database import get_db
from backend.schemas.event import Event, EventCreate, EventUpdate
from backend.db.models import EventModel, UserModel
from backend.routers.basecurd import BaseCRUD
from backend.routers.auth import AuthHandler

import dateutil.parser


class EventRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=Event, post_schema=EventCreate, put_schema=EventUpdate, model=EventModel)

    def register_routes(self):
        # UUID 또는 문자열 ID 사용
        self.router.add_api_route("/", self.get_items, response_model=list[Event], methods=["GET"])
        self.router.add_api_route("/", self.create_item, response_model=Event, methods=["POST"])
        self.router.add_api_route("/{item_id}", self.get_item, response_model=Event, methods=["GET"])
        self.router.add_api_route("/{item_id}", self.update_item, response_model=Event, methods=["PUT"])
        self.router.add_api_route("/{item_id}", self.delete_item, methods=["DELETE"])
        self.router.add_api_route("/{item_id}", self.patch_item, response_model=Event, methods=["PATCH"])

    # =========================
    # 권한/헬퍼
    # =========================
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

    @staticmethod
    def _can_edit(current_user: UserModel, event: EventModel) -> bool:
        """
        - MANAGER/ADMIN: 항상 True
        - STAFF: 본인이 만든 일정만 True
        """
        if current_user.permission_level in ("MANAGER", "ADMIN"):
            return True
        return event.creator == current_user.name

    @staticmethod
    def parse_datetime(value):
        if isinstance(value, str):
            return dateutil.parser.isoparse(value)
        return value

    # =========================
    # 목록 조회
    # =========================
    def get_items(
        self,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        """
        STAFF
        ✔️ 조회 가능
          - 내가 만든 일정
          - 다른 STAFF가 만든 일정
          - MANAGER/ADMIN이 만든 일정 중 is_public=True 인 것

        MANAGER / ADMIN
        ✔️ 모든 일정 조회 가능
        """
        if self.is_manager_or_admin(current_user):
            items = db.query(EventModel).all()
        else:
            admin_names = self._names_by_permission(db, ("MANAGER", "ADMIN"))
            staff_names = self._names_by_permission(db, ("STAFF",))

            items = db.query(EventModel).filter(
                or_(
                    # 내가 만든 일정
                    EventModel.creator == current_user.name,
                    # 다른 STAFF들이 만든 일정
                    EventModel.creator.in_(staff_names),
                    # MANAGER/ADMIN 이 만든 공개 일정
                    and_(
                        EventModel.is_public == True,
                        EventModel.creator.in_(admin_names),
                    )
                )
            ).all()

        # can_edit 정보 포함해서 반환 (Event 스키마에 can_edit 필드 있다고 가정)
        response_items = []
        for item in items:
            can_edit = self._can_edit(current_user, item)
            event_data = item.__dict__
            event_data["can_edit"] = can_edit
            response_items.append(Event(**event_data))

        return response_items

    # =========================
    # 단일 조회
    # =========================
    def get_item(
        self,
        item_id: str,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        item = db.query(self.model).filter(self.model.id == item_id).first()
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        # MANAGER/ADMIN 은 무조건 조회 가능
        if self.is_manager_or_admin(current_user):
            return item

        # STAFF 읽기 허용 조건
        # 1) 내가 만든 일정
        if item.creator == current_user.name:
            return item

        # 2) STAFF 가 만든 일정 (staff 끼리는 서로 다 봄)
        staff_names = self._names_by_permission(db, ("STAFF",))
        if item.creator in staff_names:
            return item

        # 3) MANAGER/ADMIN 이 만든 공개 일정
        admin_names = self._names_by_permission(db, ("MANAGER", "ADMIN"))
        if getattr(item, "is_public", False) and item.creator in admin_names:
            return item

        # 그 외는 접근 불가
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="권한이 없습니다."
        )

    # =========================
    # 생성
    # =========================
    def create_item(
        self,
        item: EventCreate,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        return super().create_item(item=item, db=db)

    # =========================
    # 전체 수정 (PUT)
    # =========================
    def update_item(
        self,
        item_id: str,
        item: EventUpdate,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        """
        권한별 일정 수정
        - STAFF: 본인이 만든 것만 수정 가능
        - MANAGER/ADMIN: 모든 일정 수정 가능
        """
        db_item = db.query(self.model).filter(self.model.id == item_id).first()
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        if not self.is_manager_or_admin(current_user):
            if db_item.creator != current_user.name:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="본인이 생성한 항목만 수정할 수 있습니다."
                )

        for key, value in item.model_dump().items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item

    # =========================
    # 부분 수정 (PATCH)
    # =========================
    def patch_item(
        self,
        item_id: str,
        item: EventUpdate,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        """
        권한별 일정 부분 수정
        - STAFF: 본인이 만든 것만 수정 가능
        - MANAGER/ADMIN: 모든 일정 수정 가능
        """
        db_item = db.query(self.model).get(item_id)
        if db_item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        if not self.is_manager_or_admin(current_user):
            if db_item.creator != current_user.name:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="본인이 생성한 항목만 수정할 수 있습니다."
                )

        for key, value in item.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
        return db_item

    # =========================
    # 삭제
    # =========================
    def delete_item(
        self,
        item_id: str,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(AuthHandler.get_current_user),
    ):
        """
        권한별 일정 삭제
        - STAFF: 본인이 만든 것만 삭제 가능
        - MANAGER/ADMIN: 모든 일정 삭제 가능
        """
        db_item = db.query(self.model).filter(self.model.id == item_id).first()
        if not db_item:
            return {"message": "Item deleted"}  # idempotent

        if not self.is_manager_or_admin(current_user):
            if db_item.creator != current_user.name:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="본인이 생성한 항목만 삭제할 수 있습니다."
                )

        db.delete(db_item)
        db.commit()
        return {"message": "Item deleted"}
