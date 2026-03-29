from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

from routers import auth, dataset
from database import Base, engine
from json_utils import clean_for_json, NaNSafeEncoder
from fastapi.responses import Response

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# ─── Custom JSON response to handle NaN/Inf ────────────────────────────────────
class CustomJSONResponse(Response):
    media_type = "application/json"
    
    def render(self, content):
        content = clean_for_json(content)
        return json.dumps(content, cls=NaNSafeEncoder).encode("utf-8")

app = FastAPI(title="TalkingBI API", version="1.0.0")
app.default_response_class = CustomJSONResponse

# ─── CORS ──────────────────────────────────────────────────────────────────────
# Allow the React dev server to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(dataset.router, tags=["Dataset"])


@app.get("/health")
def health():
    return {"status": "ok"}
