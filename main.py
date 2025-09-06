from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional, Union

from fastapi import Depends, FastAPI, HTTPException, status, Request, Cookie, Response
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.cors import CORSMiddleware
import uvicorn

from backend.routers import auth, customer, property, contact, image, download, event, jjinbba, jjinbba_child, customer_law, chat, user
from backend.db.database import conn


@asynccontextmanager
async def lifespan(app: FastAPI):
    conn()
    yield


app = FastAPI(lifespan=lifespan)
auth_handler = auth.AuthHandler()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.AuthHandler().router, tags=["oauth"], prefix="/oauth")
app.include_router(customer.CustomerRouter().router, tags=["customer"], prefix="/api/customer")
app.include_router(customer_law.CustomerLawRouter().router, tags=["customer_law"], prefix="/api/customer_law")
app.include_router(property.router, tags=["property"], prefix="/api/property")
app.include_router(contact.ContactRouter().router, tags=["contact"], prefix="/api/contact")
app.include_router(download.FileRouter().router, tags=["download"], prefix="/api/download")
app.include_router(download.DataCategoryRouter().router, tags=["data_category"], prefix="/api/data_category")
app.include_router(jjinbba.JjinbbaRouter().router, tags=["jjinbba"], prefix="/api/jjinbba")
app.include_router(jjinbba_child.JjinbbaChildRouter().router, tags=["jjinbba_child"], prefix="/api/jjinbba_child")
app.include_router(event.EventRouter().router, tags=["event"], prefix="/api/event")
app.include_router(image.router, tags=["image"], prefix="/api/image")
app.include_router(chat.ChatRouter().router, tags=["chat"], prefix="/api/predict")
app.include_router(user.UserRouter().router, tags=["Admin Users"], prefix="/api/users")
app.include_router(auth_handler.router, tags=["Authentication"], prefix="/oauth")

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

templates = Jinja2Templates(directory="frontend/templates")




@app.get("/")
async def root(request: Request):
    # If already logged in, redirect to customer page
    if request.cookies.get("access_token"):
        return RedirectResponse(url="/customer", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("login.html", {"request": request, "hide_sidebar": True})


@app.get("/admin/users", response_class=HTMLResponse)
async def get_user_management_page(request: Request):
    """
    사용자 관리 페이지를 렌더링합니다.
    (추후 관리자만 접근 가능하도록 인증 로직 추가 필요)
    """
    return templates.TemplateResponse("users.html", {"request": request})


@app.get("/customer")
async def move_customer(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("customer.html", {"request": request, "hide_sidebar": False})


@app.get("/customer_law")
async def move_customer_law(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("customer_law.html", {"request": request, "hide_sidebar": False})


@app.get("/contact")
async def move_contact(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("contact.html", {"request": request, "hide_sidebar": False})


@app.get("/property")
async def move_property(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("property.html", {"request": request, "hide_sidebar": False})


@app.get("/jjinbba")
@app.get("/jjinbba/{number}")
async def move_jjinbba(request: Request, number: int = None):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("jjinbba.html", {"number": number, "request": request, "hide_sidebar": False})


@app.get("/jjinbba_list")
async def move_jjinbba_list(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("jjinbba_list.html", {"request": request, "hide_sidebar": False})


@app.get("/jjinbba_list/{jjinbba_id}")
@app.get("/jjinbba_list/{jjinbba_id}/{number}")
async def move_jjinbba_detail(request: Request, jjinbba_id: int, number: int = None):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("jjinbba_detail.html",
                                      {"jjinbba_id": jjinbba_id, "number": number, "request": request, "hide_sidebar": False})


@app.get("/download/{category}/{data_category_id}")
async def move_download(request: Request, category: str, data_category_id: int):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("download.html", {"data_category_id": data_category_id, "request": request, "hide_sidebar": False})


@app.get("/download/{category}/{data_category_id}/{board_id}")
async def move_board(request: Request, category: str, data_category_id: int, board_id: int):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("board.html",
                                      {"data_category_id": data_category_id, "board_id": board_id, "request": request, "hide_sidebar": False})


@app.get("/calendar")
async def move_calendar(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse("calendar.html", {"request": request, "hide_sidebar": False})


@app.get("/oauth/logout")
async def logout():
    response = RedirectResponse(url='/')
    response.delete_cookie(key="access_token")
    return response

if __name__ == "__main__":
    uvicorn.run(f"{Path(__file__).stem}:app", host="0.0.0.0", port=80, reload=True)