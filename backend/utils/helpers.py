"""
Utility helpers for MongoDB document serialization and date handling.

Follow-up "today" boundaries are computed in IST (UTC+5:30) so that
the dashboard refreshes at midnight IST, not midnight UTC.
All values stored in MongoDB remain UTC datetimes.
"""

from datetime import datetime, date, timezone, timedelta
from bson import ObjectId

# IST = UTC + 5:30
IST = timezone(timedelta(hours=5, minutes=30))


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None

    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value
        else:
            result[key] = value
    return result


def serialize_docs(docs: list) -> list:
    """Serialize a list of MongoDB documents"""
    return [serialize_doc(doc) for doc in docs]


def date_to_datetime(d: date) -> datetime:
    """
    Convert a calendar date (as chosen by the user) to a UTC datetime.
    We interpret the date as IST midnight (00:00 IST) and convert to UTC,
    so a follow-up set for Apr 16 fires at Apr 15 18:30 UTC — which is
    still midnight in India.
    """
    ist_midnight = datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=IST)
    return ist_midnight.astimezone(timezone.utc)


def now_utc() -> datetime:
    """Return current UTC datetime (timezone-aware)"""
    return datetime.now(timezone.utc)


def now_ist() -> datetime:
    """Return current IST datetime"""
    return datetime.now(IST)


def start_of_day_ist() -> datetime:
    """
    Return today's 00:00:00 IST expressed as UTC.
    This is the boundary used for 'today' follow-up detection.
    """
    now = now_ist()
    ist_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return ist_midnight.astimezone(timezone.utc)


def end_of_day_ist() -> datetime:
    """
    Return today's 23:59:59 IST expressed as UTC.
    """
    now = now_ist()
    ist_eod = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    return ist_eod.astimezone(timezone.utc)


# Keep old names as aliases so existing call-sites don't break
def start_of_day(dt: datetime = None) -> datetime:
    return start_of_day_ist()


def end_of_day(dt: datetime = None) -> datetime:
    return end_of_day_ist()