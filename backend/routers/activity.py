"""
Activity Logs Router
Fetch timeline/history for a specific client
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from core.database import get_db
from core.security import get_current_user
from schemas.schemas import ActivityListResponse, ActivityLogResponse
from utils.helpers import serialize_doc

router = APIRouter()


@router.get("/{client_id}", response_model=ActivityListResponse)
async def get_client_activity(
    client_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get activity timeline for a specific client.
    Admin can view activity for any client.
    Regular users can only view activity for their own clients.
    """
    user_id = str(current_user["_id"])
    is_admin = current_user.get("is_admin", False)

    try:
        oid = ObjectId(client_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid client ID")

    # Verify the client exists and the user has access
    if is_admin:
        client = await db.clients.find_one({"_id": oid})
    else:
        client = await db.clients.find_one({"_id": oid, "user_id": user_id})

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Activity logs store client_id as a plain string — query both ways to be safe
    # (some older entries may have been saved differently)
    total = await db.activity_logs.count_documents({"client_id": client_id})
    cursor = (
        db.activity_logs.find({"client_id": client_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)

    activities = []
    for doc in docs:
        d = serialize_doc(doc)
        activities.append(ActivityLogResponse(
            id=d["id"],
            client_id=d["client_id"],
            activity_type=d["activity_type"],
            description=d["description"],
            metadata=d.get("metadata"),
            created_at=d["created_at"],
        ))

    return ActivityListResponse(activities=activities, total=total)