from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import (
    DailyEntry,
    EntryCreate,
    EntryOut,
    EntryOutWithDeleted,
    EntryUpdate,
    User,
)
from security import get_current_user

router = APIRouter(prefix="/employee", tags=["employee"])


def month_range(value: str) -> tuple[date, date]:
    """Return the first day of the given YYYY-MM month and the first day of the next."""
    year, number = map(int, value.split("-"))
    next_year = year + (1 if number == 12 else 0)
    next_month = (number % 12) + 1
    return date(year, number, 1), date(next_year, next_month, 1)


# ---------------------------------------------------------------------------
# List entries for the current month
# ---------------------------------------------------------------------------
@router.get("/entries", response_model=list[EntryOut])
def list_my_entries(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = month_range(month)
    return (
        db.query(DailyEntry)
        .filter(
            DailyEntry.user_id == current_user.id,
            DailyEntry.is_deleted.is_(False),
            DailyEntry.entry_date >= start,
            DailyEntry.entry_date < end,
        )
        .order_by(DailyEntry.created_at.asc())
        .all()
    )


# ---------------------------------------------------------------------------
# Create a new entry
# ---------------------------------------------------------------------------
@router.post("/entries", response_model=EntryOut, status_code=status.HTTP_201_CREATED)
def create_entry(
    payload: EntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = DailyEntry(user_id=current_user.id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Edit an existing entry (partial update)
# ---------------------------------------------------------------------------
@router.patch("/entries/{entry_id}", response_model=EntryOut)
def update_entry(
    entry_id: UUID,
    payload: EntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(DailyEntry)
        .filter(
            DailyEntry.id == entry_id,
            DailyEntry.user_id == current_user.id,
            DailyEntry.is_deleted.is_(False),
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    has_changes = False
    for field, value in payload.model_dump(exclude_none=True).items():
        current_value = getattr(entry, field)
        if current_value != value:
            setattr(entry, field, value)
            has_changes = True

    if has_changes:
        entry.created_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Soft-delete (move to bin)
# ---------------------------------------------------------------------------
@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(DailyEntry)
        .filter(
            DailyEntry.id == entry_id,
            DailyEntry.user_id == current_user.id,
            DailyEntry.is_deleted.is_(False),
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.is_deleted = True
    entry.deleted_at = datetime.now(timezone.utc)
    db.commit()


# ---------------------------------------------------------------------------
# Recycle Bin: list deleted entries (latest first, lazy-purge entries > 30 days)
# ---------------------------------------------------------------------------
@router.get("/trash", response_model=list[EntryOutWithDeleted])
def list_trash(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    # Hard-delete entries older than 30 days (lazy purge on read)
    db.query(DailyEntry).filter(
        DailyEntry.user_id == current_user.id,
        DailyEntry.is_deleted.is_(True),
        DailyEntry.deleted_at <= cutoff,
    ).delete(synchronize_session=False)
    db.commit()

    return (
        db.query(DailyEntry)
        .filter(
            DailyEntry.user_id == current_user.id,
            DailyEntry.is_deleted.is_(True),
        )
        .order_by(DailyEntry.deleted_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# Recycle Bin: restore an entry back to the calendar
# ---------------------------------------------------------------------------
@router.post("/trash/{entry_id}/restore", response_model=EntryOut)
def restore_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(DailyEntry)
        .filter(
            DailyEntry.id == entry_id,
            DailyEntry.user_id == current_user.id,
            DailyEntry.is_deleted.is_(True),
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found in bin")

    entry.is_deleted = False
    entry.deleted_at = None
    db.commit()
    db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Recycle Bin: permanently delete an entry
# ---------------------------------------------------------------------------
@router.delete("/trash/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def permanent_delete_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(DailyEntry)
        .filter(
            DailyEntry.id == entry_id,
            DailyEntry.user_id == current_user.id,
            DailyEntry.is_deleted.is_(True),
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found in bin")

    db.delete(entry)
    db.commit()

