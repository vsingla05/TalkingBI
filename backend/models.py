from sqlalchemy import Column, Integer, String, DateTime, func
from database import Base


class User(Base):
    """Represents an application user stored in PostgreSQL."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)          # bcrypt hash
    created_at = Column(DateTime(timezone=True), server_default=func.now())
