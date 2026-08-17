from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import DailyEntry, EntryOut, User, UserOut, UserRole
from security import require_leader

router = APIRouter(prefix="/leader", tags=["leader"])


def month_range(value: str) -> tuple[date, date]:
    """Return the first day of the given YYYY-MM month and the first day of the next."""
    year, number = map(int, value.split("-"))
    next_year = year + (1 if number == 12 else 0)
    next_month = (number % 12) + 1
    return date(year, number, 1), date(next_year, next_month, 1)


@router.get("/employees", response_model=list[UserOut])
def employees(
    _: User = Depends(require_leader),
    db: Session = Depends(get_db),
):
    return (
        db.query(User)
        .filter(User.role == UserRole.employee)
        .order_by(User.full_name.asc())
        .all()
    )


@router.get("/employees/{employee_id}/entries", response_model=list[EntryOut])
def employee_entries(
    employee_id: UUID,
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    _: User = Depends(require_leader),
    db: Session = Depends(get_db),
):
    start, end = month_range(month)
    return (
        db.query(DailyEntry)
        .filter(
            DailyEntry.user_id == employee_id,
            DailyEntry.is_deleted.is_(False),
            DailyEntry.entry_date >= start,
            DailyEntry.entry_date < end,
        )
        .order_by(DailyEntry.created_at.asc())
        .all()
    )
