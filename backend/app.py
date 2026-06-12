from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

from routers import auth, dataset
from database import Base, engine
from json_utils import clean_for_json, NaNSafeEncoder
from fastapi.responses import Response
import logging

# Attempt to create all tables on startup. If the database is unreachable
# (for example, a misconfigured DATABASE_URL or a downed cloud DB), don't
# let the whole application crash — log the error and continue so the API
# can still serve non-DB endpoints. The `app.state.db_available` flag is set
# for runtime checks elsewhere in the codebase.
logger = logging.getLogger(__name__)
try:
    Base.metadata.create_all(bind=engine)
    db_available = True
except Exception as e:
    logger.exception("Failed to create DB tables on startup: %s", e)
    db_available = False

# ─── Custom JSON response to handle NaN/Inf ────────────────────────────────────
class CustomJSONResponse(Response):
    media_type = "application/json"
    
    def render(self, content):
        content = clean_for_json(content)
        return json.dumps(content, cls=NaNSafeEncoder).encode("utf-8")

app = FastAPI(title="TalkingBI API", version="1.0.0")
app.default_response_class = CustomJSONResponse
# Expose DB availability to the running app so routes can check and return
# a friendly 503 when the DB is down.
app.state.db_available = db_available

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
