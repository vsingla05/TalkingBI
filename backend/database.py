from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import DATABASE_URL

# SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ─── Dependency injected into routes ───────────────────────────────────────────
def get_db():
    """Yield a DB session and ensure it closes after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
