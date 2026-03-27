from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from auth_utils import get_current_user_id
from redis_client import redis_client
from schemas import SetDatasetRequest, DatasetStatusResponse, AnalyzeRequest
from config import SESSION_TTL

router = APIRouter()


# ─── Redis key helpers ─────────────────────────────────────────────────────────

def _dataset_key(user_id: int) -> str:
    return f"active_dataset:{user_id}"


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
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "PIPELINE_ERROR", "message": str(exc)},
        )
    except Exception as exc:
        # Unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "INTERNAL_ERROR", "message": f"Pipeline failed: {exc}"},
        )

    return result
