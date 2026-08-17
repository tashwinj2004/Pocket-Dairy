from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import LoginRequest, RegisterRequest, TokenOut, User, UserOut
from security import SESSION_DAYS, create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        or_(
            User.email == payload.email.lower(),
            User.employee_id == payload.employee_id,
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email or employee ID is already registered",
        )

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        employee_id=payload.employee_id,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenOut(
        access_token=create_access_token(user),
        expires_in=SESSION_DAYS * 86400,
        user=user,
    )


@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return TokenOut(
        access_token=create_access_token(user),
        expires_in=SESSION_DAYS * 86400,
        user=user,
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
