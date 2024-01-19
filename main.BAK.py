from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
import uvicorn
import os

from sqlalchemy import create_engine, Column, Integer, String, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

database = "postgresql"
user = os.environ.get("POSTGRES_USER", "hive")
password = os.environ.get("POSTGRES_PASSWORD", "root")
database_url = os.environ.get("POSTGRES_HOST", "postgres")
database_port = os.environ.get("POSTGRES_TCP_PORT", "5432")
database_name = os.environ.get("POSTGRES_DB", "hive")

SQLALCHEMY_DATABASE_URL = f"{database}://{user}:{password}@{database_url}:{database_port}/{database_name}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
metadata = MetaData()

Base = declarative_base()

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)

Base.metadata.create_all(bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()


if __name__ == "__main__":
    
    uvicorn.run(app, host="0.0.0.0", port=80)