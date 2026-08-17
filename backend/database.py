"""Database configuration for Pocket Dairy."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()
# The @ in the supplied password must be percent-encoded when used in a URL.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:DragonBallZ%40PGSQL@localhost:5432/Pocket_Dairy",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
