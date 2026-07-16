import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure, ConfigurationError

logger = logging.getLogger(__name__)

# Load from root .env (one single env file for all services).
# Falls back to backend/.env for backwards compatibility.
_root_env    = Path(__file__).resolve().parents[2] / ".env"
_backend_env = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=_root_env if _root_env.exists() else _backend_env)

# ── Read from environment — NO hardcoded fallback ────────────────────────────
# On Render: set MONGODB_URI in the Environment Variables dashboard.
# Locally:   set MONGODB_URI in the root .env file.
MONGODB_URI     = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ai_diet_planner")

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI environment variable is not set. "
        "Add it to your .env file (local) or Render Environment Variables (production). "
        "Example: MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/"
    )

# Atlas SRV connections require the `dnspython` package.
# Standard pip install pymongo[srv] or pip install dnspython covers this.
try:
    client = MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=10000,   # 10 s — Atlas cold-start can be slow
        connectTimeoutMS=10000,
        socketTimeoutMS=30000,
    )
    # Verify connection immediately at startup
    client.admin.command("ping")
    db: Database = client[MONGODB_DB_NAME]

    # Determine display URI (hide password for logs)
    _display_uri = MONGODB_URI
    if "@" in MONGODB_URI:
        _parts = MONGODB_URI.split("@")
        _display_uri = "mongodb+srv://***:***@" + _parts[-1]
    logger.info(f"✅ Connected to MongoDB Atlas → {_display_uri}  db={MONGODB_DB_NAME}")

except ConfigurationError as e:
    logger.error(
        f"❌ MongoDB configuration error: {e}. "
        "Ensure dnspython is installed: pip install 'pymongo[srv]'"
    )
    raise

except (ServerSelectionTimeoutError, ConnectionFailure) as e:
    logger.error(
        f"❌ Could not connect to MongoDB: {e}. "
        "Check that MONGODB_URI is correct and that your IP is whitelisted in Atlas Network Access."
    )
    raise

except Exception as e:
    logger.error(f"❌ Unexpected MongoDB error: {e}")
    raise


def get_db() -> Database:
    return db
