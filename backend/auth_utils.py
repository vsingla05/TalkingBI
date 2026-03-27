from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# bcrypt v4/v5 compatibility: always work with bytes

from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES, SESSION_TTL
from redis_client import redis_client

# ─── Password hashing ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Return a bcrypt hash of the given plain-text password."""
    hashed_bytes = bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt())
    return hashed_bytes.decode("utf-8")  # store as string in DB


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ─── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(user_id: int) -> str:
    """
    Create a signed JWT that encodes the user_id.
    Expiry is set to JWT_EXPIRE_MINUTES from now.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[int]:
    """
    Decode and verify a JWT.  Returns user_id (int) or None if invalid / expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        return int(user_id) if user_id else None
    except JWTError:
        return None


# ─── FastAPI dependency — Bearer token extraction ──────────────────────────────

_bearer = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> int:
    """
    FastAPI dependency that:
    1. Extracts the Bearer token from the Authorization header.
    2. Verifies the JWT and extracts user_id.
    3. Confirms the session still exists in Redis.
    Raises 401 if anything is invalid.
    """
    token = credentials.credentials
    user_id = decode_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Confirm the session is alive in Redis
    if not redis_client.exists(f"session:{user_id}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired, please log in again",
        )

    return user_id


# ─── Redis session helpers ─────────────────────────────────────────────────────

def create_session(user_id: int) -> None:
    """
    Store session:{user_id} = true in Redis with SESSION_TTL expiry.
    Called right after a successful login.
    """
    redis_client.set(f"session:{user_id}", "true", ex=SESSION_TTL)


def delete_session(user_id: int) -> None:
    """Remove session from Redis on logout."""
    redis_client.delete(f"session:{user_id}")
