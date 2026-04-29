"""
Clients Router
Full CRUD operations + dashboard + search/filter endpoints
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId

from core.database import get_db
from core.security import get_current_user
from schemas.schemas import (
    ClientCreate, ClientUpdate, ClientResponse,
    ClientListResponse, DashboardResponse, ClientStatus, ActivityType
)
from utils.helpers import serialize_doc, serialize_docs, now_utc, start_of_day, end_of_day, date_to_datetime

router = APIRouter()


# ─── Helper: Log Activity ──────────────────────────────────────────────────────

async def log_activity(db, client_id: str, activity_type: ActivityType, description: str, metadata: dict = None):
    """Create an activity log entry for a client"""
    await db.activity_logs.insert_one({
        "client_id": client_id,
        "activity_type": activity_type,
        "description": description,
        "metadata": metadata or {},
        "created_at": now_utc(),
    })


# ─── Helper: Format Client ────────────────────────────────────────────────────

def format_client(doc: dict) -> ClientResponse:
    """Convert MongoDB doc to ClientResponse"""
    d = serialize_doc(doc)
    return ClientResponse(
        id=d["id"],
        user_id=d["user_id"],
        name=d["name"],
        phone=d["phone"],
        notes=d.get("notes"),
        status=d["status"],
        next_followup_date=d.get("next_followup_date"),
        created_at=d["created_at"],
        updated_at=d["updated_at"],
    )


# ─── CREATE Client ────────────────────────────────────────────────────────────

@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create a new client"""
    user_id = str(current_user["_id"])
    
    followup_dt = None
    if payload.followup_date:
        followup_dt = date_to_datetime(payload.followup_date)
    
    client_doc = {
        "user_id": user_id,
        "name": payload.name.strip(),
        "phone": payload.phone.strip(),
        "notes": payload.notes,
        "status": payload.status.value if hasattr(payload.status, "value") else str(payload.status),
        "next_followup_date": followup_dt,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    
    result = await db.clients.insert_one(client_doc)
    client_doc["_id"] = result.inserted_id
    client_id = str(result.inserted_id)
    
    # Log client creation
    await log_activity(db, client_id, ActivityType.CLIENT_CREATED,
                       f"Client '{payload.name}' was added")
    
    # Log initial follow-up if set
    if followup_dt:
        await log_activity(db, client_id, ActivityType.FOLLOWUP_SET,
                           f"Follow-up scheduled for {payload.followup_date}",
                           {"followup_date": str(payload.followup_date)})
    
    return format_client(client_doc)


# ─── LIST / SEARCH Clients ────────────────────────────────────────────────────

@router.get("/", response_model=ClientListResponse)
async def list_clients(
    search: Optional[str] = Query(None, description="Search by name or phone"),
    status_filter: Optional[ClientStatus] = Query(None, alias="status"),
    followup_from: Optional[str] = Query(None, description="Filter followup from date (YYYY-MM-DD)"),
    followup_to: Optional[str] = Query(None, description="Filter followup to date (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """List clients with optional search and filters"""
    user_id = str(current_user["_id"])
    is_admin = current_user.get("is_admin", False)
    query = {} if is_admin else {"user_id": user_id}
    
    # Search by name or phone
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    
    # Filter by status
    if status_filter:
        query["status"] = status_filter
    
    # Filter by follow-up date range
    if followup_from or followup_to:
        followup_query = {}
        if followup_from:
            followup_query["$gte"] = datetime.fromisoformat(followup_from).replace(tzinfo=timezone.utc)
        if followup_to:
            followup_query["$lte"] = datetime.fromisoformat(followup_to).replace(tzinfo=timezone.utc)
        query["next_followup_date"] = followup_query
    
    total = await db.clients.count_documents(query)
    cursor = db.clients.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    
    return ClientListResponse(
        clients=[format_client(doc) for doc in docs],
        total=total
    )


# ─── DASHBOARD ────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get dashboard data: today / upcoming / overdue follow-ups"""
    user_id = str(current_user["_id"])
    now = now_utc()
    today_start = start_of_day(now)
    today_end = end_of_day(now)
    upcoming_end = now + timedelta(days=7)
    
    is_admin = current_user.get("is_admin", False)
    user_filter = {} if is_admin else {"user_id": user_id}
    base_query = {**user_filter, "next_followup_date": {"$ne": None}, "status": {"$ne": "Closed"}}
    
    # Today's follow-ups
    today_docs = await db.clients.find({
        **base_query,
        "next_followup_date": {"$gte": today_start, "$lte": today_end}
    }).to_list(length=100)
    
    # Upcoming (next 7 days, excluding today)
    upcoming_docs = await db.clients.find({
        **base_query,
        "next_followup_date": {"$gt": today_end, "$lte": upcoming_end}
    }).sort("next_followup_date", 1).to_list(length=100)
    
    # Overdue (before today)
    overdue_docs = await db.clients.find({
        **base_query,
        "next_followup_date": {"$lt": today_start}
    }).sort("next_followup_date", 1).to_list(length=100)
    
    # Stats
    total_clients = await db.clients.count_documents(user_filter if is_admin else {"user_id": user_id})
    status_pipeline = [
        {"$match": user_filter if is_admin else {"user_id": user_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = {}
    async for doc in db.clients.aggregate(status_pipeline):
        status_counts[doc["_id"]] = doc["count"]
    
    return DashboardResponse(
        today_followups=[format_client(d) for d in today_docs],
        upcoming_followups=[format_client(d) for d in upcoming_docs],
        overdue_followups=[format_client(d) for d in overdue_docs],
        stats={
            "total": total_clients,
            "today_count": len(today_docs),
            "upcoming_count": len(upcoming_docs),
            "overdue_count": len(overdue_docs),
            "by_status": status_counts,
        }
    )


# ─── GET Single Client ────────────────────────────────────────────────────────

@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get a single client by ID"""
    user_id = str(current_user["_id"])
    
    try:
        oid = ObjectId(client_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    fetch_filter = {"_id": oid} if current_user.get("is_admin") else {"_id": oid, "user_id": user_id}
    doc = await db.clients.find_one(fetch_filter)
    if not doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return format_client(doc)


# ─── GET Client Owner (admin only) ───────────────────────────────────────────

@router.get("/{client_id}/owner")
async def get_client_owner(
    client_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Return the name of the user who owns this client (admin only)"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        oid = ObjectId(client_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    client = await db.clients.find_one({"_id": oid})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    owner = await db.users.find_one({"_id": ObjectId(client["user_id"])})
    owner_name = owner["name"] if owner else "Unknown"
    return {"owner_name": owner_name}


# ─── UPDATE Client ────────────────────────────────────────────────────────────

@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update a client's details"""
    user_id = str(current_user["_id"])
    
    try:
        oid = ObjectId(client_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    # Fetch existing client (admin can update any client)
    fetch_filter = {"_id": oid} if current_user.get("is_admin") else {"_id": oid, "user_id": user_id}
    existing = await db.clients.find_one(fetch_filter)
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = {"updated_at": now_utc()}
    activity_logs = []
    
    # Track status change
    if payload.status and payload.status != existing.get("status"):
        old_status = existing.get("status")
        # Use .value to get human-readable string, not 'ClientStatus.FOLLOW_UP_LATER'
        new_status_str = payload.status.value if hasattr(payload.status, 'value') else str(payload.status)
        old_status_str = old_status.value if hasattr(old_status, 'value') else str(old_status)
        update_data["status"] = new_status_str
        activity_logs.append((
            ActivityType.STATUS_CHANGED,
            f"Status changed from '{old_status_str}' to '{new_status_str}'",
            {"old_status": old_status_str, "new_status": new_status_str}
        ))
    
    # Track follow-up date change
    if payload.followup_date is not None:
        new_followup_dt = date_to_datetime(payload.followup_date)
        update_data["next_followup_date"] = new_followup_dt
        activity_logs.append((
            ActivityType.FOLLOWUP_SET,
            f"Follow-up rescheduled to {payload.followup_date}",
            {"followup_date": str(payload.followup_date)}
        ))
    
    # Update other fields
    if payload.name is not None:
        update_data["name"] = payload.name.strip()
    if payload.phone is not None:
        update_data["phone"] = payload.phone.strip()
    if payload.notes is not None:
        old_notes = existing.get("notes", "")
        update_data["notes"] = payload.notes
        if payload.notes != old_notes:
            activity_logs.append((
                ActivityType.NOTE_ADDED,
                "Notes were updated",
                {"notes_preview": payload.notes[:100]}
            ))
    
    await db.clients.update_one({"_id": oid}, {"$set": update_data})
    
    # Write activity logs
    for act_type, description, meta in activity_logs:
        await log_activity(db, client_id, act_type, description, meta)
    
    updated = await db.clients.find_one({"_id": oid})
    return format_client(updated)


# ─── DELETE Client ────────────────────────────────────────────────────────────

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a client and all associated activity logs"""
    user_id = str(current_user["_id"])
    
    try:
        oid = ObjectId(client_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid client ID")
    
    delete_filter = {"_id": oid} if current_user.get("is_admin") else {"_id": oid, "user_id": user_id}
    result = await db.clients.delete_one(delete_filter)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Clean up activity logs
    await db.activity_logs.delete_many({"client_id": client_id})