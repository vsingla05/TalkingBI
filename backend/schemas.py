from pydantic import BaseModel, EmailStr, field_validator


# ─── Auth schemas ──────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Dataset schemas ───────────────────────────────────────────────────────────

class SetDatasetRequest(BaseModel):
    dataset_id: str


class DatasetStatusResponse(BaseModel):
    has_dataset: bool
    dataset_id: str | None = None


class AnalyzeRequest(BaseModel):
    dataset_link: str | None = None
    query: str
    requested_charts: list[str]
