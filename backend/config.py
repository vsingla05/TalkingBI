import os
from dotenv import load_dotenv

load_dotenv(override=True)

# ─── PostgreSQL ────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/bi_db")

# ─── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-change-me-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60  # 1 hour

# ─── Redis ─────────────────────────────────────────────────────────────────────
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# ─── Session TTL ───────────────────────────────────────────────────────────────
SESSION_TTL = 3600  # seconds (1 hour)

# ─── LLM ────────────────────────────────────────────────────────────────────
#
# PRIMARY: Ollama (local, always used first)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.2:8b")
#
# OPTIONAL FALLBACK: Groq (cloud, only used if GROQ_API_KEY is set)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
LLM_MODEL    = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")  # Groq model name

# ─── Analysis DB ────────────────────────────────────────────────────────────────
# SQLite file for per-session analysis tables (separate from user auth DB)
ANALYSIS_DB_PATH = os.getenv("ANALYSIS_DB_PATH", "./analysis.db")
ANALYSIS_DB_URL = f"sqlite:///{ANALYSIS_DB_PATH}"
