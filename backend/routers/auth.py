import secrets
from typing import Optional
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import Depends, FastAPI, Header, Query, Request, HTTPException, status, APIRouter
from backend.auth.oauth_client import OAuthClient
from fastapi.templating import Jinja2Templates
from config import DEBURG_MODE

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
            redirect_uri="http://1.234.222.31:8000/oauth/callback",  # http://1.234.222.31:8000
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
    def get_oauth_client():  # provider: str = Query(..., regex="kakao"
        return kakao_client
            

    @staticmethod
    def get_authorization_token(authorization: str = Header(...)) -> str:
        scheme, _, param = authorization.partition(" ")
        if not authorization or scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Not authenticated",
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

    async def login_kakao(self,
                          oauth_client=Depends(get_oauth_client),
                          request: Request=None):
        state = secrets.token_urlsafe(32)
        redirect_uri = f"{request.base_url}oauth/callback"
        login_url = oauth_client.get_oauth_login_url(
            state=state,
            redirect_uri=redirect_uri   # ← 동적으로 들어감
        )
        return RedirectResponse(login_url)

    async def callback(self, code: str, state: Optional[str] = None, oauth_client=Depends(get_oauth_client), request: Request=None):
        token_response = await oauth_client.get_tokens(code, state)
        access_token = token_response.get('access_token')
        if not DEBURG_MODE:
            user_info = await oauth_client.get_user_info(access_token)
            user_info = user_info.get('kakao_account').get('email')
            if user_info not in users:
                return templates.TemplateResponse(
                    "401.html",
                    {"request": request},
                    status_code=401
                )

        # Create a response that sets a cookie and redirects
        response = RedirectResponse(url='/customer')
        response.set_cookie(key="access_token", value=access_token, httponly=True)

        return response

    async def refresh(self, oauth_client=Depends(get_oauth_client), refresh_token: str = Depends(get_authorization_token)):
        token_response = await oauth_client.refresh_access_token(refresh_token=refresh_token)
        return {"response": token_response}

    async def get_user(self, oauth_client=Depends(get_oauth_client), access_token: str = Depends(get_authorization_token)):
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