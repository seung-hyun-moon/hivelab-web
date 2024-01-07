from fastapi import APIRouter, HTTPException, responses, File, UploadFile
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import base64
import os
from typing import Annotated
from pathlib import Path

router = APIRouter()
BASE_DIR = Path('./APP_DATA')


@router.get("/{id}/{img_name}")
async def get_image(id:str, img_name: str):
    img_full_path = os.path.join(BASE_DIR, id, img_name)
    print(img_full_path)
    if os.path.exists(img_full_path):
        return responses.FileResponse(img_full_path)
    else:
        raise HTTPException(status_code=404, detail="Image not found")
    
@router.post("/{id}/uploadfile/")
async def create_upload_file(
    file: Annotated[UploadFile, File(description="A file read as UploadFile")],
):
    return {"filename": file.filename}

@router.post("/{id}/uploadfiles/")
async def create_upload_files(files: list[UploadFile]):
    return {"filenames": [file.filename for file in files]}