from fastapi import FastAPI, Request
from backend.routers import auth, customer, property, contact, image
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.cors import CORSMiddleware
import uvicorn
from pathlib import Path
from backend.db.database import conn

app = FastAPI()

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
app.include_router(auth.router, tags=["auth"], prefix="/auth")

app.include_router(customer.router, tags=["customer"], prefix="/api/customer")
app.include_router(property.router, tags=["property"], prefix="/api/property")
app.include_router(contact.router, tags=["contact"], prefix="/api/contact")

app.include_router(image.router, tags=["image"], prefix="/api/image")

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

templates = Jinja2Templates(directory="frontend/templates")

@app.on_event("startup")
def on_startup():
    conn()

# Root endpoint
@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/signup")
async def signup(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@app.get("/customer")
async def move_customer(request: Request):
    return templates.TemplateResponse("customer.html", {"request": request})

@app.get("/contact")
async def move_contact(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})

@app.get("/property")
async def move_property(request: Request):
    return templates.TemplateResponse("property.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run(f"{Path(__file__).stem}:app", host="0.0.0.0", port=80, reload=True)
