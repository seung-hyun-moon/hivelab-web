from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from backend.schemas import customer
from backend.db import models
from backend.db.database import get_db

router = APIRouter()


@router.get("/", response_model=List[customer.Customer])
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(models.Customer).all()
    return customers


@router.get("/{customer_id}", response_model=customer.Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/", response_model=customer.Customer)
def create_customer(customer: customer.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.put("/{customer_id}", response_model=customer.Customer)
def update_customer(customer_id: int, customer: customer.CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in customer.dict().items():
        setattr(db_customer, field, value)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted"}
