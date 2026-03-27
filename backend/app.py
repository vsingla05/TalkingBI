from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, dataset
from database import Base, engine

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TalkingBI API", version="1.0.0")

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
