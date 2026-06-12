from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import SignupRequest, LoginRequest, TokenResponse
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_session,
    delete_session,
    get_current_user_id,
)

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, db: Session = Depends(get_db), request: Request = None):
    """
    Register a new user.
    - Validates email + password via Pydantic.
    - Rejects duplicate emails.
    - Hashes password with bcrypt before storing.
    - Returns a JWT so the user is immediately logged in.
    """
    # If app startup previously failed to create/connect to the DB, return 503
    if request and not request.app.state.db_available:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database is currently unavailable")

    try:
        existing = db.query(User).filter(User.email == body.email).first()
    except Exception:
        # Surface a friendly error when DB operations fail
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database error during signup")
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(email=body.email, password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    create_session(user.id)

    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db), request: Request = None):
    """
    Authenticate an existing user.
    - Looks up the user by email.
    - Verifies the bcrypt password hash.
    - Issues a new JWT and refreshes the Redis session.
    """
    if request and not request.app.state.db_available:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database is currently unavailable")

    try:
        user = db.query(User).filter(User.email == body.email).first()
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database error during login")

    # Generic message to avoid user-enumeration attacks
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    create_session(user.id)

    return TokenResponse(access_token=token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user_id: int = Depends(get_current_user_id)):
    """
    Invalidate the Redis session so the JWT can no longer be used,
    even if it hasn't expired yet.
    """
    delete_session(user_id)
