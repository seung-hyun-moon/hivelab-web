import secrets
from typing import Optional
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi import Depends, Header, Request, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from backend.auth.oauth_client import OAuthClient
from fastapi.templating import Jinja2Templates
from config import DEBURG_MODE, IP
from backend.db.database import get_db
from backend.db.models import UserModel

templates = Jinja2Templates(directory="frontend/templates")

users = [
    '-.-cooluk@hanmail.net',
    'ccoccabi@naver.com',
    'gilllllll@naver.com',
    'kj4784@nate.com',
    'qhry1539@naver.com',
    'chokv6256@nate.com',
    ]

kakao_client = OAuthClient(
    client_id="d96da7ca7c6250bdd4223796d4878d43",
    client_secret_id="fL7s4KDzqW8ALK9INFY8mZcBDNBiUGCn",
    redirect_uri=f"http://{IP}/oauth/callback",
    authentication_uri="https://kauth.kakao.com/oauth",
    resource_uri="https://kapi.kakao.com/v2/user/me",
    verify_uri="https://kapi.kakao.com/v1/user/access_token_info",
)

async def get_refresh_token(request: Request) -> str:
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Missing refresh_token cookie.",
        )
    return refresh_token

class AuthHandler(object):
    def __init__(self):
        self.router = APIRouter()
        self.register_routes()

    def register_routes(self):
        self.router.add_api_route("/login", self.login_kakao, methods=["GET"])
        self.router.add_api_route(
            "/refresh",
            self.refresh,
            dependencies=[Depends(get_refresh_token)],  # login_required 대신 refresh_token을 직접 받도록
            methods=["GET"]
        )
        self.router.add_api_route("/callback", self.callback, methods=["GET"])
        self.router.add_api_route("/refresh", self.refresh, methods=["GET"])
        self.router.add_api_route("/user", self.get_user, dependencies=[Depends(self.login_required)], methods=["GET"])
        self.router.add_api_route("/hive_user", self.get_hive_user, dependencies=[Depends(self.login_required)], methods=["GET"])

    @staticmethod
    def get_oauth_client():
        return kakao_client

    @staticmethod
    def get_authorization_token(
            authorization: Optional[str] = Header(None),  # Authorization 헤더는 선택 사항으로 변경
            request: Request = None  # Request 객체를 추가
    ) -> str:

        # 1. Authorization 헤더 확인 (기존 로직 유지)
        if authorization:
            scheme, _, param = authorization.partition(" ")
            if scheme.lower() == "bearer":
                return param

        # 2. httponly 쿠키에서 access_token 확인
        if request and "access_token" in request.cookies:
            return request.cookies["access_token"]

        # 3. 모든 시도 실패 시 401 UNAUTHORIZED 발생
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Missing Bearer token or access_token cookie.",
            headers={"WWW-Authenticate": "Bearer"},
        )

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

    @staticmethod
    async def get_current_user(
            oauth_client: OAuthClient = Depends(get_oauth_client),
            access_token: str = Depends(get_authorization_token),
            db: Session = Depends(get_db)
    ) -> UserModel:
        """
        인증된 access_token으로 카카오 유저 정보를 조회하고,
        데이터베이스에서 해당 유저의 UserModel 객체를 반환합니다.
        """
        # 2. 카카오 사용자 정보 조회
        try:
            user_info_response = await oauth_client.get_user_info(access_token)
            email = user_info_response.get('kakao_account', {}).get('email')
        except Exception:
            # 카카오 API 호출 실패 시
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not fetch user information from Kakao",
            )

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not provided by Kakao",
            )

        # 3. 데이터베이스에서 사용자 조회
        db_user = db.query(UserModel).filter(UserModel.email == email).first()

        # 사용자가 DB에 없거나 계정이 잠겨(is_active=False)있는 경우
        if not db_user or not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not registered or account is inactive",
            )

        return db_user

    async def callback(self, code: str, state: Optional[str] = None, oauth_client=Depends(get_oauth_client),
                       request: Request = None, db: Session = Depends(get_db)):
        token_response = await oauth_client.get_tokens(code, state)
        access_token = token_response.get('access_token')
        refresh_token = token_response.get('refresh_token')
        access_token_expires_in = token_response.get('expires_in')
        refresh_token_expires_in = token_response.get('refresh_token_expires_in')

        if not DEBURG_MODE:
            user_info_response = await oauth_client.get_user_info(access_token)
            email = user_info_response.get('kakao_account', {}).get('email')

            if not email:
                return templates.TemplateResponse(
                    "401.html",
                    {"request": request, "error_message": "카카오로부터 이메일 정보를 가져올 수 없습니다."},
                    status_code=401
                )

            db_user = db.query(UserModel).filter(UserModel.email == email).first()

            if not db_user or not db_user.is_active:
                return templates.TemplateResponse(
                    "401.html",
                    {"request": request, "error_message": "등록되지 않은 사용자이거나 계정이 잠겨있습니다."},
                    status_code=401
                )

        response = RedirectResponse(url='/customer')

        if access_token:
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                max_age=access_token_expires_in,  # 카카오가 준 만료시간 설정
                samesite="lax"
            )

        if refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                max_age=refresh_token_expires_in,  # 카카오가 준 만료시간 설정
                samesite="lax"
            )

        return response

    async def refresh(self,
                      oauth_client=Depends(get_oauth_client),
                      refresh_token: str = Depends(get_refresh_token)  # 새로 만든 의존성 사용
                      ):
        try:
            token_response = await oauth_client.refresh_access_token(refresh_token=refresh_token)
        except Exception:
            # 리프래시 토큰이 유효하지 않으면 401 반환
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token."
            )

        new_access_token = token_response.get('access_token')
        new_access_token_expires_in = token_response.get('expires_in')

        # 중요: 카카오 정책에 따라 리프래시 토큰이 갱신될 수 있습니다 (Refresh Token Rotation)
        new_refresh_token = token_response.get('refresh_token')
        new_refresh_token_expires_in = token_response.get('refresh_token_expires_in')

        # JSONResponse를 사용하여 본문과 쿠키를 동시에 설정
        response = JSONResponse(content={"message": "Token refreshed successfully"})

        if new_access_token:
            response.set_cookie(
                key="access_token",
                value=new_access_token,
                httponly=True,
                max_age=new_access_token_expires_in,
                samesite="lax"
            )

        if new_refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=new_refresh_token,
                httponly=True,
                max_age=new_refresh_token_expires_in,
                samesite="lax"
            )

        return response

    async def get_user(self, oauth_client=Depends(get_oauth_client),
                       access_token: str = Depends(get_authorization_token)):
        user_info = await oauth_client.get_user_info(access_token=access_token)
        return {"user": user_info}

    async def get_hive_user(self, oauth_client=Depends(get_oauth_client),
                            access_token: str = Depends(get_authorization_token),
                            db: Session = Depends(get_db)
                            ):
        user_info = await oauth_client.get_user_info(access_token)
        email = user_info.get('kakao_account', {}).get('email')
        db_user = db.query(UserModel).filter(UserModel.email == email).first()
        return {"user": user_info, 'db_user': db_user}

    async def is_token_valid(self, access_token: Optional[str] = None):
        if not access_token:
            return False
        oauth_client = self.get_oauth_client()
        try:
            return await oauth_client.is_authenticated(access_token)
        except Exception as e:
            print(f"Token validation error: {e}")
            return False
