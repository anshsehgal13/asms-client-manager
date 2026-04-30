"""
SMS Client Manager - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.database import connect_db, close_db
from routers import auth, clients, activity


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="SMS Client Manager API",
    description="Backend API for SMS Client Management System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://asms-client-manager-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(activity.router, prefix="/api/activity", tags=["Activity"])


@app.get("/")
async def root():
    return {"message": "SMS Client Manager API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
