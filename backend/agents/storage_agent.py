"""
AGENT 2: Dataset Storage
─────────────────────────
Persists the cleaned Pandas DataFrame into a SQLite analysis database.
Each user/session gets their own table: `ds_user{user_id}` (replaced on update).
"""

import re
import pandas as pd
from sqlalchemy import create_engine, text
from config import ANALYSIS_DB_URL


def _get_engine():
    return create_engine(ANALYSIS_DB_URL, connect_args={"check_same_thread": False})


def get_table_name(user_id: int) -> str:
    """Deterministic, SQL-safe table name per user."""
    return f"ds_user_{user_id}"


def store_dataset(df: pd.DataFrame, user_id: int) -> str:
    """
    Stores the DataFrame into the analysis SQLite DB.
    Replaces the table if it already exists (fresh dataset = fresh table).

    Returns the table name used.
    """
    table_name = get_table_name(user_id)
    engine = _get_engine()

    # Datetime columns cannot be stored natively in SQLite; convert to ISO strings
    df_to_store = df.copy()
    for col in df_to_store.select_dtypes(include=["datetime64[ns]", "datetimetz"]).columns:
        df_to_store[col] = df_to_store[col].astype(str)

    df_to_store.to_sql(table_name, con=engine, if_exists="replace", index=False)
    print(f"✅ Dataset stored → table='{table_name}' ({len(df_to_store)} rows)")
    return table_name


def get_schema_for_llm(user_id: int) -> tuple[str, str]:
    """
    Returns (schema_description, sample_csv) for the stored table.
    Used by the SQL Agent to build an informed prompt.
    """
    table_name = get_table_name(user_id)
    engine = _get_engine()

    with engine.connect() as conn:
        sample_df = pd.read_sql(f'SELECT * FROM "{table_name}" LIMIT 25', conn)

    schema_lines = []
    for col in sample_df.columns:
        dtype = str(sample_df[col].dtype)
        sample_vals = sample_df[col].dropna().head(3).tolist()
        schema_lines.append(f"  - {col} ({dtype}), e.g.: {sample_vals}")

    schema_str = "\n".join(schema_lines)
    sample_csv = sample_df.head(25).to_csv(index=False)
    return schema_str, sample_csv
