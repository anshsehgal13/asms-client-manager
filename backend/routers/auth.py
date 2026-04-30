"""
Authentication Router
"""
from fastapi import APIRouter, HTTPException, Depends, status
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token, get_current_user
from schemas.schemas import UserSignup, UserLogin, TokenResponse, UserResponse
from utils.helpers import serialize_doc, now_utc

router = APIRouter()

def make_user_response(user_data: dict) -> UserResponse:
    return UserResponse(
        id=user_data["id"],
        name=user_data["name"],
        email=user_data["email"],
        is_admin=user_data.get("is_admin", False),
        created_at=user_data["created_at"],
    )

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserSignup, db=Depends(get_db)):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_doc = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "is_admin": False,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token, user=make_user_response(serialize_doc(user_doc)))


@router.post("/login")
async def login(payload: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": payload.email.lower()})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # TEMP BYPASS PASSWORD CHECK
    return {"message": "User found, password step skipped"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return make_user_response(serialize_doc(current_user))
