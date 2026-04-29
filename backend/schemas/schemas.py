"""
Pydantic schemas for data validation and serialization
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class ClientStatus(str, Enum):
    NOT_RESPONDED = "Not Responded"
    INTERESTED = "Interested"
    FOLLOW_UP_LATER = "Follow-up Later"
    CLOSED = "Closed"


class ActivityType(str, Enum):
    NOTE_ADDED = "note_added"
    STATUS_CHANGED = "status_changed"
    FOLLOWUP_SET = "followup_set"
    FOLLOWUP_LOGGED = "followup_logged"
    CLIENT_CREATED = "client_created"


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    is_admin: bool = False
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Client Schemas ───────────────────────────────────────────────────────────

class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=5, max_length=20)
    notes: Optional[str] = Field(None, max_length=2000)
    status: ClientStatus = ClientStatus.NOT_RESPONDED
    followup_date: Optional[date] = None  # ISO date string or None


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, min_length=5, max_length=20)
    notes: Optional[str] = Field(None, max_length=2000)
    status: Optional[ClientStatus] = None
    followup_date: Optional[date] = None


class ClientResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    notes: Optional[str] = None
    status: ClientStatus
    next_followup_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ClientListResponse(BaseModel):
    clients: List[ClientResponse]
    total: int


# ─── Activity Log Schemas ─────────────────────────────────────────────────────

class ActivityLogResponse(BaseModel):
    id: str
    client_id: str
    activity_type: ActivityType
    description: str
    metadata: Optional[dict] = None
    created_at: datetime


class ActivityListResponse(BaseModel):
    activities: List[ActivityLogResponse]
    total: int


# ─── Dashboard Schemas ────────────────────────────────────────────────────────

class DashboardResponse(BaseModel):
    today_followups: List[ClientResponse]
    upcoming_followups: List[ClientResponse]
    overdue_followups: List[ClientResponse]
    stats: dict
