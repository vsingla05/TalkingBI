import os
import time
import shutil
import traceback
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.concurrency import run_in_threadpool

from auth_utils import get_current_user_id
from redis_client import redis_client
from schemas import SetDatasetRequest, DatasetStatusResponse, AnalyzeRequest, AskQuestionRequest
from config import SESSION_TTL

router = APIRouter()


# ─── Redis key helpers ─────────────────────────────────────────────────────────

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _dataset_key(user_id: int) -> str:
    return f"active_dataset:{user_id}"

def cleanup_old_uploads():
    """Delete uploaded files older than the SESSION_TTL (1 hour)."""
    now = time.time()
    for filename in os.listdir(UPLOAD_DIR):
        path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(path):
            if now - os.path.getmtime(path) > SESSION_TTL:
                try:
                    os.remove(path)
                except Exception:
                    pass

# ─── Routes ────────────────────────────────────────────────────────────────────

@router.get("/dataset-status", response_model=DatasetStatusResponse)
def dataset_status(user_id: int = Depends(get_current_user_id)):
    """Return whether the authenticated user has an active dataset in Redis."""
    dataset_id = redis_client.get(_dataset_key(user_id))
    return DatasetStatusResponse(
        has_dataset=dataset_id is not None,
        dataset_id=dataset_id,
    )


@router.post("/set-dataset", status_code=status.HTTP_200_OK)
def set_dataset(body: SetDatasetRequest, user_id: int = Depends(get_current_user_id)):
    """Explicitly associate a dataset URL with the current user session in Redis."""
    redis_client.set(_dataset_key(user_id), body.dataset_id, ex=SESSION_TTL)
    return {"message": "Active dataset updated", "dataset_id": body.dataset_id}


@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_dataset(file: UploadFile = File(...), user_id: int = Depends(get_current_user_id)):
    """
    Handle local file upload.
    Saves to uploads/ dir and stores the path in Redis as active dataset.
    Old files are cleaned up transparently.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    cleanup_old_uploads()  # Prune expired files transparently
    
    # Save the file uniquely per user + timestamp to avoid clashes
    uuid = f"user{user_id}_{int(time.time())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, uuid)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    local_uri = f"local://{file_path}"
    
    # Set it as the active dataset in Redis
    redis_client.set(_dataset_key(user_id), local_uri, ex=SESSION_TTL)
    
    return {
        "message": "File uploaded successfully",
        "dataset_id": local_uri
    }


@router.post("/analyze")
async def analyze(body: AnalyzeRequest, user_id: int = Depends(get_current_user_id)):
    """
    Main agentic analysis endpoint.

    Behaviour:
    ──────────
    • If dataset_link is provided → use it (update Redis if changed).
    • If dataset_link is omitted  → fall back to Redis session value.
    • If both are missing         → 400 NO_DATASET.

    The full 6-step AI pipeline is then run in a thread-pool so the
    async event-loop is never blocked by Pandas / LLM I/O.
    """
    from agents.pipeline import run_pipeline   # lazy import keeps startup fast

    redis_key = _dataset_key(user_id)
    current_in_redis = redis_client.get(redis_key)

    # ── Resolve active dataset ─────────────────────────────────────────────────
    if body.dataset_link and body.dataset_link.strip():
        active_dataset = body.dataset_link.strip()
        if current_in_redis != active_dataset:
            print(f"🔄 Updating Redis dataset for user {user_id}")
            redis_client.set(redis_key, active_dataset, ex=SESSION_TTL)
        else:
            print(f"ℹ️  Same dataset link — skipping Redis write for user {user_id}")
    else:
        if current_in_redis:
            active_dataset = current_in_redis
            print(f"✅ Using Redis session dataset for user {user_id}: {active_dataset}")
        else:
            print(f"❌ User {user_id} submitted without a dataset.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "NO_DATASET",
                    "message": "No active dataset found. Please enter a dataset URL first.",
                },
            )

    # ── Run the agentic pipeline (blocking I/O → thread-pool) ─────────────────
    try:
        result = await run_in_threadpool(
            run_pipeline,
            dataset_url=active_dataset,
            user_query=body.query,
            requested_charts=body.requested_charts,
            user_id=user_id,
        )
    except ValueError as exc:
        # Anticipated errors (bad URL, bad SQL, empty result, etc.)
        print("[analyze] Pipeline ValueError:", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "PIPELINE_ERROR", "message": str(exc)},
        )
    except Exception as exc:
        # Log full traceback for debugging, then return 500
        print("[analyze] Pipeline unexpected exception:")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "INTERNAL_ERROR", "message": f"Pipeline failed: {exc}"},
        )

    return result


@router.post("/auto-dashboard")
async def auto_dashboard(body: SetDatasetRequest, user_id: int = Depends(get_current_user_id)):
    """
    Triggers the Autonomous Dashboard Agent to generate 4 complete dashboards
    with charts, insights, and voice naration scripts from a dataset URL.
    """
    from agents.pipeline import run_auto_dashboard_pipeline

    dataset_link = body.dataset_id.strip() if body.dataset_id else None
    redis_key = _dataset_key(user_id)
    
    if dataset_link:
        redis_client.set(redis_key, dataset_link, ex=SESSION_TTL)
    else:
        dataset_link = redis_client.get(redis_key)
        if not dataset_link:
            raise HTTPException(
                status_code=400,
                detail={"error": "NO_DATASET", "message": "No dataset found."}
            )

    try:
        result = await run_in_threadpool(
            run_auto_dashboard_pipeline,
            dataset_url=dataset_link,
            user_id=user_id,
        )
    except Exception as exc:
        print("[auto_dashboard] unexpected exception:")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"error": "AUTO_DASHBOARD_ERROR", "message": str(exc)}
        )

    return result


@router.post("/dashboard-voice-summary")
async def dashboard_voice_summary(body: dict, user_id: int = Depends(get_current_user_id)):
    """
    Generate an AI voice summary for a dashboard.
    Accepts dashboard_type (kpi, analytics, performance, insights) and dashboard_data.
    Returns audio_url with MP3 file.
    """
    from agents.pipeline import generate_dashboard_summary_voice
    
    dashboard_type = body.get("dashboard_type", "kpi")
    dashboard_data = body.get("dashboard_data", {})
    
    if not dashboard_data:
        raise HTTPException(
            status_code=400,
            detail={"error": "NO_DATA", "message": "Dashboard data is required."}
        )
    
    try:
        result = await run_in_threadpool(
            generate_dashboard_summary_voice,
            dashboard_type=dashboard_type,
            dashboard_data=dashboard_data,
            user_id=user_id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "VOICE_GENERATION_ERROR", "message": str(exc)}
        )
    
    return result


# ─── New Endpoint: Ask Follow-up Questions ──────────────────────────────────────

@router.post("/ask-question")
async def ask_question(body: AskQuestionRequest, user_id: int = Depends(get_current_user_id)):
    """
    Process follow-up questions and generate new charts dynamically.
    
    Behaviour:
    ──────────
    • Takes a follow-up question from the user
    • Uses the active dataset from Redis
    • Runs the full AI pipeline with the new question
    • Returns new charts based on the question
    • Can be called multiple times for multi-turn conversations
    """
    from agents.pipeline import run_pipeline
    
    redis_key = _dataset_key(user_id)
    active_dataset = redis_client.get(redis_key)
    
    if not active_dataset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "NO_DATASET",
                "message": "No active dataset. Please upload or select a dataset first.",
            },
        )
    
    # Run the pipeline with the new question
    try:
        result = await run_in_threadpool(
            run_pipeline,
            dataset_url=active_dataset,
            user_query=body.question.strip(),
            requested_charts=body.requested_charts,
            user_id=user_id,
        )
    except ValueError as exc:
        print("[ask_question] Pipeline ValueError:", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "QUESTION_ERROR", "message": str(exc)},
        )
    except Exception as exc:
        print("[ask_question] unexpected exception:")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "INTERNAL_ERROR", "message": f"Failed to process question: {exc}"},
        )
    
    return result


@router.post("/generate-comparisons")
async def generate_comparisons(user_id: int = Depends(get_current_user_id)):
    """
    Auto-generate all relevant comparisons, metrics, and relationships
    based on the active dataset's schema.
    
    Analyzes numeric and categorical fields to create intelligent visualizations.
    """
    print(f"[generate_comparisons] user={user_id}")
    
    # Check for active dataset
    active_dataset = redis_client.get(_dataset_key(user_id))
    if not active_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "NO_DATASET",
                "message": "No active dataset. Please upload or select a dataset first.",
            },
        )
    
    # Import here to avoid circular dependency
    from agents.pipeline import run_auto_comparison_pipeline
    
    # Run the comparison agent
    try:
        result = await run_in_threadpool(
            run_auto_comparison_pipeline,
            dataset_url=active_dataset,
            user_id=user_id,
        )
        return result
    
    except Exception as exc:
        print("[generate_comparisons] unexpected exception:")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "INTERNAL_ERROR", "message": f"Failed to generate comparisons: {exc}"},
        )
