from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.cors import CORSMiddleware
import uvicorn

from backend.routers import auth, customer, property, contact, image, download
from backend.db.database import conn


@asynccontextmanager
async def lifespan(app: FastAPI):
    conn()
    yield

app = FastAPI()
auth_handler = auth.AuthHandler()


origins = [
    "http://0.0.0.0:80"
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
app.include_router(property.router, tags=["property"], prefix="/api/property")
app.include_router(contact.ContactRouter().router, tags=["contact"], prefix="/api/contact")
app.include_router(download.FileRouter().router, tags=["download"], prefix="/api/download")

app.include_router(image.router, tags=["image"], prefix="/api/image")

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

templates = Jinja2Templates(directory="frontend/templates")



# Root endpoint
@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "hide_buttons": True})

@app.get("/customer")
async def move_contact(request: Request):
    return templates.TemplateResponse("customer.html", {"request": request})

@app.get("/contact")
async def move_contact(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})

@app.get("/property")
async def move_property(request: Request):
    return templates.TemplateResponse("property.html", {"request": request})

@app.get("/download")
async def move_download(request: Request):
    return templates.TemplateResponse("download.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run(f"{Path(__file__).stem}:app", host="0.0.0.0", port=80, reload=True)
