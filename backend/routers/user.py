from fastapi import APIRouter, Depends
from sqlalchemy import case
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.db.models import UserModel
from backend.schemas.user import User, UserCreate, UserUpdate, UserName
from backend.routers.basecurd import BaseCRUD


class UserRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        super().__init__(get_schema=User, post_schema=UserCreate, put_schema=UserUpdate, model=UserModel)
        self.router.add_api_route(
            "/activie_users",
            self.get_active_user_names,
            response_model=list[UserName],
            methods=["GET"]
        )

        self.router.add_api_route(
            "/nonengineer_users",
            self.get_active_non_engineer_names,
            response_model=list[UserName],
            methods=["GET"]
        )


    def create_item(self, item: UserCreate, db: Session = Depends(get_db)):
        return super().create_item(item=item, db=db)

    def update_item(self, item_id: int, item: UserUpdate, db: Session = Depends(get_db)):
        return super().update_item(item_id=item_id, item=item, db=db)

    def patch_item(self, item_id: int, item: UserUpdate, db: Session = Depends(get_db)):
        return super().patch_item(item_id=item_id, item=item, db=db)

    def get_active_user_names(self, db: Session = Depends(get_db)):
        return (
            db.query(self.model)
            .filter(self.model.is_active == True)
            .order_by(
                case(
                    (self.model.position == "대표", 0),
                    (self.model.position == "이사", 1),
                    (self.model.position == "팀장", 2),
                    (self.model.position == "차장", 3),
                    (self.model.position == "과장", 4),
                    (self.model.position == "엔지니어", 5),
                    else_=6
                ),
                self.model.name  # 동일 직급 내 이름순
            )
            .all()
        )

    # ✅ is_active = 1 AND position != "엔지니어"
    def get_active_non_engineer_names(self, db: Session = Depends(get_db)):
        return (
            db.query(self.model)
            .filter(
                self.model.is_active == True,
                self.model.position != "엔지니어"
            )
            .order_by(
                case(
                    (self.model.position == "대표", 0),
                    (self.model.position == "이사", 1),
                    (self.model.position == "팀장", 2),
                    (self.model.position == "차장", 3),
                    (self.model.position == "과장", 4),
                    else_=5  # 엔지니어 제외했으니 5까지만 필요
                ),
                self.model.name  # 동일 직급 내 이름순
            )
            .all()
        )