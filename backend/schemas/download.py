from pydantic import BaseModel, Field
from typing import Optional

# 파일 정보 스키마
class DataBase(BaseModel):
    filename: str
    description: Optional[str] = None
    registration_date: Optional[str] = None
    file_path: str

    class Config:
        from_attributes = True

# 파일 생성 스키마
class DataCreate(DataBase):
    pass

# 파일 업데이트 스키마
class DataUpdate(DataBase):
    pass

class Data(DataBase):
    id: int

    class Config:
        from_attributes = True