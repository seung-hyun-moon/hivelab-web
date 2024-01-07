from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from typing import List
from sqlalchemy.orm import Session
from typing import Annotated
from pathlib import Path
import shutil

from backend.db.database import get_db
from backend.db import models
from backend.schemas import property

router = APIRouter()

BASE_DIR = Path('./APP_DATA')

@router.get("/", response_model=List[property.Property])
def get_properties(db: Session = Depends(get_db)):
    properties = db.query(models.Property).all()
    return properties


@router.post("/", response_model=property.Property)
async def create_property(property: property.PropertyCreate, db: Session = Depends(get_db)):
    db_property = models.Property(**property.dict(), 
                                  thumbnail_path=property.thumbnail_path.filename, 
                                  imgs_path=str([img.filename for img in property.imgs_path])
                                  )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)

    # Create a directory for this property
    property_dir = BASE_DIR / str(db_property.id)
    property_dir.mkdir(parents=True, exist_ok=True)

    # Save the thumbnail
    thumbnail_path = property_dir / property.thumbnail_path.filename
    with thumbnail_path.open("wb") as buffer:
        buffer.write(await property.PropertyCreate.thumbnail_path.read())

    # Save the images
    for img in property.imgs_path:
        img_path = property_dir / img.filename
        with img_path.open("wb") as buffer:
            buffer.write(await img.read())

    return db_property

@router.get("/{property_id}", response_model=property.Property)
def read_property(property_id: int, db: Session = Depends(get_db)):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@router.put("/{property_id}", response_model=property.Property)
async def update_property(property_id: int, property: property.PropertyUpdate, thumbnail_path: UploadFile = File(...), imgs_path: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    for key, value in property.dict().items():
        setattr(db_property, key, value)
    db.commit()
    db.refresh(db_property)

    # Create a directory for this property
    property_dir = BASE_DIR / str(db_property.id)
    property_dir.mkdir(parents=True, exist_ok=True)

    # Save the thumbnail
    thumbnail_path = property_dir / thumbnail_path.filename
    with thumbnail_path.open("wb") as buffer:
        buffer.write(await thumbnail_path.read())

    # Save the images
    for img in imgs_path:
        img_path = property_dir / img.filename
        with img_path.open("wb") as buffer:
            buffer.write(await img.read())

    return db_property

@router.delete("/{property_id}", response_model=property.Property)
def delete_property(property_id: int, db: Session = Depends(get_db)):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")

    # Delete the directory for this property
    property_dir = BASE_DIR / str(db_property.id)
    if property_dir.exists() and property_dir.is_dir():
        shutil.rmtree(property_dir)

    db.delete(db_property)
    db.commit()

    return db_property