"""
AGENT 4: SQL Execution
───────────────────────
Executes the LLM-generated SQL query against the analysis SQLite database.
Returns results as a list of dicts (JSON-serializable) ready for chart rendering.
"""

import pandas as pd
from sqlalchemy import create_engine, text
from config import ANALYSIS_DB_URL


def _get_engine():
    return create_engine(ANALYSIS_DB_URL, connect_args={"check_same_thread": False})


def execute_sql(sql_query: str, max_rows: int = 200) -> list[dict]:
    """
    Execute `sql_query` on the analysis SQLite database.
    Returns up to `max_rows` records as a list of dicts.

    Raises:
        ValueError: if the query fails or returns 0 rows.
    """
    # Safety guard: only allow SELECT statements
    normalized = sql_query.strip().upper()
    if not normalized.startswith("SELECT"):
        raise ValueError("Only SELECT queries are permitted.")

    engine = _get_engine()

    try:
        with engine.connect() as conn:
            result_df = pd.read_sql(text(sql_query), conn)
    except Exception as e:
        raise ValueError(f"SQL execution failed: {e}\nQuery: {sql_query}")

    if result_df.empty:
        raise ValueError("SQL query returned 0 rows. Try rephrasing your question.")

    # Coerce non-JSON-serializable types (datetime → str, NA → None)
    result_df = result_df.where(result_df.notna(), other=None)
    for col in result_df.select_dtypes(include=["datetime64[ns]", "datetimetz"]).columns:
        result_df[col] = result_df[col].astype(str)

    records = result_df.head(max_rows).to_dict(orient="records")
    print(f"✅ SQL execution returned {len(records)} rows")
    return records
