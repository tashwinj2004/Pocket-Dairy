from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import Base, engine
from routers import auth, employee, leader

app = FastAPI(title="Pocket Diary API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9090"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    # Safe migration: add deleted_at column if it doesn't already exist
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE daily_entries
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
        """))
        conn.commit()


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(employee.router)
app.include_router(leader.router)

