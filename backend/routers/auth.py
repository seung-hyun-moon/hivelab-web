import secrets
from typing import Optional
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import Depends, Header, Request, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from backend.auth.oauth_client import OAuthClient
from fastapi.templating import Jinja2Templates
from config import DEBURG_MODE, IP
from backend.db.database import get_db
from backend.db.models import UserModel

templates = Jinja2Templates(directory="frontend/templates")

kakao_client = OAuthClient(
    client_id="d96da7ca7c6250bdd4223796d4878d43",
    client_secret_id="fL7s4KDzqW8ALK9INFY8mZcBDNBiUGCn",
    redirect_uri=f"http://{IP}/oauth/callback",
    authentication_uri="https://kauth.kakao.com/oauth",
    resource_uri="https://kapi.kakao.com/v2/user/me",
    verify_uri="https://kapi.kakao.com/v1/user/access_token_info",
)


class AuthHandler(object):
    def __init__(self):
        self.router = APIRouter()
        self.register_routes()

    def register_routes(self):
        self.router.add_api_route("/login", self.login_kakao, methods=["GET"])
        self.router.add_api_route("/callback", self.callback, methods=["GET"])
        self.router.add_api_route("/refresh", self.refresh, methods=["GET"])
        self.router.add_api_route("/user", self.get_user, dependencies=[Depends(self.login_required)], methods=["GET"])

    @staticmethod
    def get_oauth_client():
        return kakao_client

    @staticmethod
    def get_authorization_token(authorization: str = Header(...)) -> str:
        scheme, _, param = authorization.partition(" ")
        if not authorization or scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return param

    @staticmethod
    async def login_required(
            oauth_client: OAuthClient = Depends(get_oauth_client),
            access_token: str = Depends(get_authorization_token),
    ):
        if not await oauth_client.is_authenticated(access_token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    async def login_kakao(self, oauth_client=Depends(get_oauth_client), request: Request = None):
        state = secrets.token_urlsafe(32)
        redirect_uri = f"{request.base_url}oauth/callback"
        login_url = oauth_client.get_oauth_login_url(state=state, redirect_uri=redirect_uri)
        return RedirectResponse(login_url)

    async def callback(self, code: str, state: Optional[str] = None, oauth_client=Depends(get_oauth_client),
                       request: Request = None, db: Session = Depends(get_db)):
        token_response = await oauth_client.get_tokens(code, state)
        access_token = token_response.get('access_token')

        if not DEBURG_MODE:
            user_info_response = await oauth_client.get_user_info(access_token)
            email = user_info_response.get('kakao_account', {}).get('email')

            if not email:
                return templates.TemplateResponse(
                    "401.html",
                    {"request": request, "error_message": "카카오로부터 이메일 정보를 가져올 수 없습니다."},
                    status_code=401
                )

            # --- 데이터베이스 사용자 조회 ---
            db_user = db.query(UserModel).filter(UserModel.email == email).first()

            # 사용자가 DB에 없거나 계정이 잠겨(is_active=False)있는 경우
            if not db_user or not db_user.is_active:
                return templates.TemplateResponse(
                    "401.html",
                    {"request": request, "error_message": "등록되지 않은 사용자이거나 계정이 잠겨있습니다."},
                    status_code=401
                )

        response = RedirectResponse(url='/customer')
        response.set_cookie(key="access_token", value=access_token, httponly=True)
        return response

    async def refresh(self, oauth_client=Depends(get_oauth_client),
                      refresh_token: str = Depends(get_authorization_token)):
        token_response = await oauth_client.refresh_access_token(refresh_token=refresh_token)
        return {"response": token_response}

    async def get_user(self, oauth_client=Depends(get_oauth_client),
                       access_token: str = Depends(get_authorization_token)):
        user_info = await oauth_client.get_user_info(access_token=access_token)
        return {"user": user_info}

    async def is_token_valid(self, access_token: Optional[str] = None):
        if not access_token:
            return False
        oauth_client = self.get_oauth_client()
        try:
            return await oauth_client.is_authenticated(access_token)
        except Exception as e:
            print(f"Token validation error: {e}")
            return False
