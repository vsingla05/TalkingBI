"""
PIPELINE ORCHESTRATOR
──────────────────────
Ties all four agents together into a single `run_pipeline()` function.

Full flow:
  1. fetch_dataset         (ingestion_agent)
  2. run_cleaning_agent    (cleaning_agent)
  3. store_dataset         (storage_agent)
  4. get_schema_for_llm   (storage_agent)
  5. run_sql_agent         (sql_agent)
  6. execute_sql           (execution_agent)
  → Returns chart-ready JSON response
"""

from .ingestion_agent import fetch_dataset
from .cleaning_agent import run_cleaning_agent
from .storage_agent import store_dataset, get_schema_for_llm
from .sql_agent import run_sql_agent
from .execution_agent import execute_sql


def run_pipeline(
    dataset_url: str,
    user_query: str,
    requested_charts: list[str],
    user_id: int,
) -> dict:
    """
    Orchestrate the full agentic BI pipeline.

    Parameters
    ----------
    dataset_url     : Direct CSV URL or Google Sheets share link
    user_query      : Natural language question from the user
    requested_charts: List of chart type strings (e.g., ['bar', 'line'])
    user_id         : Authenticated user's integer ID

    Returns
    -------
    A chart-ready JSON dict:
    {
        "data": [...],
        "chart_type": "bar",
        "x_axis": "region",
        "y_axis": "total_revenue",
        "title": "Revenue by Region",
        "sql_query": "SELECT ...",
        "rows_returned": 12
    }
    """

    print("\n" + "="*60)
    print(f"🚀 PIPELINE START  |  user={user_id}")
    print(f"   dataset_url : {dataset_url}")
    print(f"   query       : {user_query}")
    print(f"   charts      : {requested_charts}")
    print("="*60)

    # ── STEP 1: Ingest ────────────────────────────────────────────
    print("\n[STEP 1] Ingesting dataset...")
    df_raw = fetch_dataset(dataset_url)

    # ── STEP 2: Clean + Feature Engineering (LLM) ─────────────────
    print("\n[STEP 2] Running Cleaning Agent (LLM)...")
    df_clean, cleaning_plan = run_cleaning_agent(df_raw)

    # ── STEP 3: Store into SQLite ─────────────────────────────────
    print("\n[STEP 3] Storing cleaned dataset...")
    table_name = store_dataset(df_clean, user_id)

    # ── STEP 4: Get Schema for SQL Agent ──────────────────────────
    print("\n[STEP 4] Extracting schema for SQL Agent...")
    schema, sample_csv = get_schema_for_llm(user_id)

    # ── STEP 5: Generate SQL + Chart Mapping (LLM) ─────────────────
    print("\n[STEP 5] Running SQL Agent (LLM)...")
    sql_plan = run_sql_agent(
        table_name=table_name,
        schema=schema,
        sample_csv=sample_csv,
        user_query=user_query,
        requested_charts=requested_charts,
    )

    # ── STEP 6: Execute SQL ────────────────────────────────────────
    print("\n[STEP 6] Executing generated SQL...")
    records = execute_sql(sql_plan["sql_query"])

    chart_map = sql_plan.get("chart_mapping", {})

    print("\n" + "="*60)
    print(f"✅ PIPELINE COMPLETE  |  {len(records)} rows returned")
    print("="*60 + "\n")

    return {
        "data": records,
        "chart_type": chart_map.get("chart_type", requested_charts[0] if requested_charts else "bar"),
        "x_axis": chart_map.get("x_axis", ""),
        "y_axis": chart_map.get("y_axis", ""),
        "title": chart_map.get("title", user_query),
        "sql_query": sql_plan["sql_query"],
        "rows_returned": len(records),
    }
