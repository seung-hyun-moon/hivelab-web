import secrets
from typing import Optional
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import Depends, FastAPI, Header, Query, Request, HTTPException, status, APIRouter
from backend.auth.oauth_client import OAuthClient

kakao_client = OAuthClient(
            client_id="d96da7ca7c6250bdd4223796d4878d43",
            client_secret_id="fL7s4KDzqW8ALK9INFY8mZcBDNBiUGCn",
            redirect_uri="http://localhost/oauth/callback",
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
        print('get_authorization_token', authorization)
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

    async def login_kakao(self, oauth_client=Depends(get_oauth_client), request: Request = None):
        state = secrets.token_urlsafe(32)
        
        # 현재 요청의 호스트가 접속한 base url 확인
        base_url = request.base_url
        
        # 동적으로 redirect_uri 생성
        redirect_uri = f"{base_url}oauth/callback"
        
        login_url = oauth_client.get_oauth_login_url(state=state, redirect_uri=redirect_uri)
        return RedirectResponse(login_url)

    async def callback(self, code: str, state: Optional[str] = None, oauth_client=Depends(get_oauth_client)):
        token_response = await oauth_client.get_tokens(code, state)
        await self.login_required(oauth_client, token_response['access_token'])
        return RedirectResponse(url='/customer')

    async def refresh(self, oauth_client=Depends(get_oauth_client), refresh_token: str = Depends(get_authorization_token)):
        token_response = await oauth_client.refresh_access_token(refresh_token=refresh_token)
        return {"response": token_response}

    async def get_user(self, oauth_client=Depends(get_oauth_client), access_token: str = Depends(get_authorization_token)):
        user_info = await oauth_client.get_user_info(access_token=access_token)
        return {"user": user_info}