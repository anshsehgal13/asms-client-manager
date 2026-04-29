"""
Database configuration and connection management
Uses Motor (async MongoDB driver)
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv

load_dotenv()

# Global database client
client = None
db = None


async def connect_db():
    """Initialize MongoDB connection"""
    global client, db

    mongo_url = os.getenv("MONGO_URI")
    if not mongo_url:
        raise ValueError("MONGO_URI not set in environment variables")

    db_name = os.getenv("DB_NAME", "sms_client_manager")

    # Initialize client
    client = AsyncIOMotorClient(mongo_url)

    # Test connection
    await client.admin.command("ping")

    db = client[db_name]

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.clients.create_index("user_id")
    await db.clients.create_index("next_followup_date")
    await db.activity_logs.create_index("client_id")

    print(f"✅ Connected to MongoDB Atlas: {db_name}")


async def close_db():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    """Return database instance"""
    return db