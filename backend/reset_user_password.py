"""
One-off script: reset salt@gmail.com password to Salt@123.
Run from the backend/ directory:
    python reset_user_password.py
Then delete this file.
"""
import os
import sys

# Load .env so DATABASE_URL is available
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

import bcrypt

# Monkeypatch passlib bug with newer bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})

from passlib.context import CryptContext
from sqlalchemy import create_engine, text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in .env")
    sys.exit(1)

TARGET_EMAIL = "salt@gmail.com"
NEW_PASSWORD = "Salt@123"

engine = create_engine(DATABASE_URL)

new_hash = pwd_context.hash(NEW_PASSWORD)

with engine.connect() as conn:
    result = conn.execute(
        text("UPDATE users SET password_hash = :h WHERE email = :e"),
        {"h": new_hash, "e": TARGET_EMAIL},
    )
    conn.commit()
    if result.rowcount == 0:
        print(f"No user found with email: {TARGET_EMAIL}")
    else:
        print(f"Password for {TARGET_EMAIL} has been reset to '{NEW_PASSWORD}' successfully.")
