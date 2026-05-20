from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# آدرس اتصال به دیتابیس (بعداً رمز عبور را تغییر می‌دهیم)
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:123456@localhost/network_plan"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
