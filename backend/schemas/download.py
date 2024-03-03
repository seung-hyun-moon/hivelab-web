from pydantic import BaseModel
from typing import Optional

# 파일 정보 스키마
class DataBase(BaseModel):
    filename: str
    description: Optional[str] = None
    registration_date: Optional[str] = None
    file_path: str
    data_category_id: int

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


class DataCategoryBase(BaseModel):
    name: str
    type: int # 0: 파일, 1: 이미지, 2: 게시판

class DataCategoryCreate(DataCategoryBase):
    pass

class DataCategoryUpdate(DataCategoryBase):
    pass

class DataCategory(DataCategoryBase):
    id: int

    class Config:
        from_attributes = True