import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure

logger = logging.getLogger(__name__)

# Load backend/.env regardless of where the process is started from.
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ai_diet_planner")

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Test the connection
    client.admin.command('ping')
    db: Database = client[MONGODB_DB_NAME]
    logger.info(f"✅ Connected to MongoDB at {MONGODB_URI}")
except (ServerSelectionTimeoutError, ConnectionFailure) as e:
    logger.error(f"❌ Failed to connect to MongoDB at {MONGODB_URI}: {str(e)}")
    logger.error("Make sure MongoDB is running. Try: mongod --dbpath ./data")
    # Create a fallback db object that will fail with clear errors
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1000)
    db: Database = client[MONGODB_DB_NAME]
except Exception as e:
    logger.error(f"❌ Unexpected error connecting to MongoDB: {str(e)}")
    raise


def get_db() -> Database:
    return db
