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

    # If there are no tables, create all tables.
    if not existing_tables:
        Base.metadata.create_all(engine)
    else:
        # Create only the new tables that do not exist.
        for table in Base.metadata.tables.values():
            if table.name not in existing_tables:
                table.create(engine)

    # Use a connection context to add new columns.
    with engine.begin() as connection:
        inspector = inspect(connection)
        for table in Base.metadata.tables.values():
            existing_columns = [col['name'] for col in inspector.get_columns(table.name)]
            for column in table.columns:
                if column.name not in existing_columns:
                    # 수정 전: column.compile(dialect=engine.dialect)
                    column_name = column.name  # 테이블 이름 없이 컬럼 이름만 사용
                    column_type = column.type.compile(engine.dialect)
                    connection.execute(
                        text(f'ALTER TABLE {table.name} ADD COLUMN {column_name} {column_type}')
                    )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()