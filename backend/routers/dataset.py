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

def _cleaned_table_key(user_id: int) -> str:
    """Redis key for the cleaned table name (prevents re-cleaning)."""
    return f"cleaned_table:{user_id}"

def _dataset_cleaning_status_key(user_id: int) -> str:
    """Redis key to track if dataset is being cleaned."""
    return f"dataset_cleaning_status:{user_id}"

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


@router.post("/prepare-dataset")
async def prepare_dataset(body: SetDatasetRequest, user_id: int = Depends(get_current_user_id)):
    """
    ONE-TIME CLEANING AND STORAGE of dataset.
    
    This endpoint should be called ONCE after dataset upload.
    It:
    1. Fetches and cleans the dataset (LLM-driven)
    2. Stores cleaned data in SQLite
    3. Caches the table name in Redis
    
    All subsequent button clicks (dashboards, comparisons, etc.)
    will use this cached table name without re-cleaning.
    
    Returns:
    - table_name: Cleaned table name for use in queries
    - schema: Table schema for LLM agents
    - status: "prepared" when successful
    """
    from agents.ingestion_agent import fetch_dataset
    from agents.cleaning_agent import run_cleaning_agent
    from agents.storage_agent import store_dataset, get_schema_for_llm
    
    # Resolve dataset URL
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
    
    # Check if already prepared
    cleaned_table_key = _cleaned_table_key(user_id)
    existing_table = redis_client.get(cleaned_table_key)
    
    if existing_table:
        # Already cleaned - return cached table info
        try:
            schema, sample_csv = await run_in_threadpool(get_schema_for_llm, user_id)
            return {
                "status": "already_prepared",
                "table_name": existing_table,
                "schema": schema,
                "sample_data": sample_csv,
                "message": f"Dataset already prepared. Using cached table: {existing_table}"
            }
        except Exception as e:
            print(f"⚠️  Error retrieving cached schema: {e}")
    
    # Mark as cleaning in progress
    status_key = _dataset_cleaning_status_key(user_id)
    redis_client.set(status_key, "cleaning", ex=60)
    
    try:
        print(f"\n📊 PREPARING DATASET FOR USER {user_id}")
        print(f"   Dataset: {dataset_link}")
        
        # Step 1: Fetch raw dataset
        print("   [1/3] Fetching dataset...")
        df_raw = await run_in_threadpool(fetch_dataset, dataset_link)
        
        # Step 2: Clean dataset (LLM-driven, includes feature engineering)
        print("   [2/3] Cleaning & feature engineering (LLM)...")
        df_clean, cleaning_plan = await run_in_threadpool(run_cleaning_agent, df_raw)
        
        # Step 3: Store cleaned data in SQLite
        print("   [3/3] Storing cleaned dataset...")
        table_name = await run_in_threadpool(store_dataset, df_clean, user_id)
        
        # Get schema for LLM agents
        schema, sample_csv = await run_in_threadpool(get_schema_for_llm, user_id)
        
        # Cache the table name so dashboards don't re-clean
        redis_client.set(cleaned_table_key, table_name, ex=SESSION_TTL)
        redis_client.delete(status_key)  # Clear cleaning status
        
        print(f"✅ DATASET PREPARED")
        print(f"   Table: {table_name}")
        print(f"   Rows: {len(df_clean)}")
        print(f"   Schema: {len(schema.splitlines())} fields")
        
        return {
            "status": "prepared",
            "table_name": table_name,
            "schema": schema,
            "sample_data": sample_csv,
            "rows": len(df_clean),
            "cleaning_plan": cleaning_plan,
            "message": f"Dataset successfully prepared. {len(df_clean)} rows ready for analysis."
        }
        
    except ValueError as exc:
        redis_client.delete(status_key)
        print(f"❌ Preparation ValueError: {exc}")
        raise HTTPException(
            status_code=422,
            detail={"error": "PREP_ERROR", "message": str(exc)},
        )
    except Exception as exc:
        redis_client.delete(status_key)
        print(f"❌ Preparation failed: {exc}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"error": "PREP_FAILED", "message": f"Failed to prepare dataset: {exc}"},
        )


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
    Generate 3 auto-dashboards using ALREADY-CLEANED data.
    
    IMPORTANT: Call /prepare-dataset FIRST to clean and prepare the data.
    This endpoint uses cached cleaned data - no re-cleaning happens.
    
    Returns 3 auto-discovered dashboards with real data.
    """
    from agents.pipeline import run_auto_dashboard_pipeline_cached
    
    # Verify that dataset has been prepared
    cleaned_table_key = _cleaned_table_key(user_id)
    if not redis_client.get(cleaned_table_key):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "NOT_PREPARED",
                "message": "Dataset not prepared. Call /prepare-dataset first."
            }
        )
    
    try:
        result = await run_in_threadpool(
            run_auto_dashboard_pipeline_cached,
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


@router.post("/generate-premium-dashboards")
async def generate_premium_dashboards(body: AskQuestionRequest, user_id: int = Depends(get_current_user_id)):
    """
    Generate 4 premium dashboards using ALREADY-CLEANED data.
    
    IMPORTANT: Call /prepare-dataset FIRST to clean and prepare the data.
    This endpoint uses cached cleaned data - no re-cleaning happens.
    
    Returns 4 dynamic dashboards (KPI, Analytics, Performance, Insights)
    with real data based on user's question.
    """
    from agents.pipeline import run_pipeline_with_dashboards_cached
    
    # Verify that dataset has been prepared
    cleaned_table_key = _cleaned_table_key(user_id)
    if not redis_client.get(cleaned_table_key):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "NOT_PREPARED",
                "message": "Dataset not prepared. Call /prepare-dataset first."
            }
        )
    
    # Run the cached pipeline (no re-cleaning)
    try:
        result = await run_in_threadpool(
            run_pipeline_with_dashboards_cached,
            user_query=body.question.strip() if body.question else "Analyze this dataset",
            user_id=user_id,
        )
        return result
    except ValueError as exc:
        print("[generate_premium_dashboards] Pipeline ValueError:", exc)
        raise HTTPException(
            status_code=422,
            detail={"error": "DASHBOARD_ERROR", "message": str(exc)},
        )
    except Exception as exc:
        print("[generate_premium_dashboards] unexpected exception:")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"error": "INTERNAL_ERROR", "message": f"Failed to generate premium dashboards: {exc}"},
        )


@router.post("/smart-comparisons")
async def smart_comparisons(body: SetDatasetRequest, user_id: int = Depends(get_current_user_id)):
    """
    Generate smart comparisons and field analysis using ALREADY-CLEANED data.
    
    IMPORTANT: Call /prepare-dataset FIRST to clean and prepare the data.
    This endpoint uses cached cleaned data - no re-cleaning happens.
    
    Returns auto-discovered comparisons, metrics, and relationships
    between all numeric/categorical fields.
    """
    from agents.pipeline import run_auto_comparison_pipeline_cached
    
    # Verify that dataset has been prepared
    cleaned_table_key = _cleaned_table_key(user_id)
    if not redis_client.get(cleaned_table_key):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "NOT_PREPARED",
                "message": "Dataset not prepared. Call /prepare-dataset first."
            }
        )
    
    try:
        result = await run_in_threadpool(
            run_auto_comparison_pipeline_cached,
            user_id=user_id,
        )
        return result
    except Exception as exc:
        print("[smart_comparisons] unexpected exception:")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"error": "COMPARISON_ERROR", "message": str(exc)}
        )


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
