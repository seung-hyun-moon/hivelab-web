from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./hive.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def conn():
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    # 기존 테이블이 없으면 모든 테이블을 생성
    if not existing_tables:
        Base.metadata.create_all(engine)
    else:
        # 기존 테이블이 있으면 새로운 테이블만 생성
        for table in Base.metadata.tables.values():
            if table.name not in existing_tables:
                table.create(engine)

    # 새로운 컬럼 추가
    for table in Base.metadata.tables.values():
        existing_columns = [col['name'] for col in inspector.get_columns(table.name)]
        for column in table.columns:
            if column.name not in existing_columns:
                column_name = column.compile(dialect=engine.dialect)
                column_type = column.type.compile(engine.dialect)
                engine.execute(text(f'ALTER TABLE {table.name} ADD COLUMN {column_name} {column_type}'))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()