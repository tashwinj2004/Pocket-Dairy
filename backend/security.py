import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

# Monkeypatch bcrypt to fix passlib bug with newer bcrypt versions
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import User, UserRole

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-before-production")
ALGORITHM = "HS256"
SESSION_DAYS = 15

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "exp": expires_at,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = UUID(payload.get("sub", ""))
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found",
        )
    return user


def require_leader(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.leader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Leader access required",
        )
    return current_user
