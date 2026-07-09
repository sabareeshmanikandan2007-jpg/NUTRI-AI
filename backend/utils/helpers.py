import os
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

# Use pbkdf2_sha256 to avoid bcrypt backend incompatibilities in some environments.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _secret_key() -> str:
    return os.getenv("JWT_SECRET_KEY", "change-this-in-production")


def _algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def _token_expire_minutes() -> int:
    return int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=_token_expire_minutes()))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, _secret_key(), algorithm=_algorithm())


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, _secret_key(), algorithms=[_algorithm()])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id


def response_ok(message: str, data: Any = None) -> Dict[str, Any]:
    return {"success": True, "message": message, "data": data}


def serialize_doc(doc: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if doc is None:
        return None

    parsed: Dict[str, Any] = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            parsed[key] = str(value)
        elif isinstance(value, datetime):
            parsed[key] = value.isoformat()
        elif isinstance(value, list):
            parsed[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
        else:
            parsed[key] = value
    return parsed


def serialize_docs(docs: Iterable[Dict[str, Any]]) -> list[Dict[str, Any]]:
    return [serialize_doc(doc) for doc in docs if doc is not None]
