"""
AGENT 1: Data Cleaning & Feature Engineering (LLM-driven)
──────────────────────────────────────────────────────────
Sends dataset sample + schema to the LLM, gets back structured cleaning
instructions, then executes them programmatically on the full DataFrame.

LLM JSON Contract:
{
    "cleaning_steps": [
        {"action": "drop_duplicates"},
        {"action": "drop_columns", "columns": ["Unnamed: 0"]},
        {"action": "fill_missing", "column": "Age", "strategy": "median"},
        {"action": "convert_type", "column": "Date", "to_type": "datetime"},
        ...
    ],
    "feature_engineering_steps": [
        {"action": "extract_year", "from_column": "Date", "new_column": "Year"},
        {"action": "extract_month", "from_column": "Date", "new_column": "Month"},
        {"action": "bin_column", "column": "Age", "bins": 4, "new_column": "AgeGroup"},
        ...
    ],
    "column_types": {
        "Revenue": "float",
        "Date": "datetime",
        ...
    }
}
"""

import json
import re
import time
import traceback
import pandas as pd
from config import LLM_MODEL
from .llm_utils import call_groq_with_retry


def _build_cleaning_prompt(sample_csv: str, columns: list[str]) -> str:
    return f"""You are an expert data scientist and Python Pandas engineer.

Analyze the following dataset sample and produce a JSON cleaning plan.

COLUMN NAMES:
{json.dumps(columns)}

DATASET SAMPLE (first 25 rows as CSV):
{sample_csv}

Return ONLY a valid JSON object with NO markdown, NO explanation, NO extra text.
Use this exact structure:
{{
    "cleaning_steps": [
        {{"action": "drop_duplicates"}},
        {{"action": "drop_columns", "columns": ["<col>", ...]}},
        {{"action": "fill_missing", "column": "<col>", "strategy": "median|mean|mode|zero|empty_string"}},
        {{"action": "convert_type", "column": "<col>", "to_type": "float|int|str|datetime"}},
        {{"action": "normalize_column_name", "old_name": "<old>", "new_name": "<new>"}}
    ],
    "feature_engineering_steps": [
        {{"action": "extract_year", "from_column": "<datetime_col>", "new_column": "<col>_Year"}},
        {{"action": "extract_month", "from_column": "<datetime_col>", "new_column": "<col>_Month"}},
        {{"action": "bin_column", "column": "<numeric_col>", "bins": 4, "new_column": "<col>_Bin"}}
    ],
    "column_types": {{
        "<column_name>": "float|int|str|datetime"
    }}
}}

Rules:
- Only include steps that are actually needed based on the data
- Normalize column names: lowercase, replace spaces/special chars with underscores
- Drop columns that appear to be index columns (e.g., "Unnamed: 0")
- Handle missing values appropriately by column type
- Parse date/time columns properly
- Do NOT create duplicate features
- Return valid JSON only"""


def _parse_llm_json(llm_output: str) -> dict:
    """Extract and parse JSON from LLM output, stripping markdown code fences."""
    text = llm_output.strip()
    # Strip ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    return json.loads(text.strip())


def _execute_cleaning_steps(df: pd.DataFrame, steps: list[dict]) -> pd.DataFrame:
    """Execute each LLM-prescribed cleaning step on the DataFrame."""
    for step in steps:
        action = step.get("action")
        try:
            if action == "drop_duplicates":
                before = len(df)
                df = df.drop_duplicates()
                print(f"  🧹 drop_duplicates: removed {before - len(df)} rows")

            elif action == "drop_columns":
                cols_to_drop = [c for c in step.get("columns", []) if c in df.columns]
                df = df.drop(columns=cols_to_drop)
                print(f"  🗑️  drop_columns: dropped {cols_to_drop}")

            elif action == "fill_missing":
                col = step.get("column")
                strategy = step.get("strategy", "mean")
                if col and col in df.columns:
                    if strategy == "median":
                        df[col] = df[col].fillna(df[col].median())
                    elif strategy == "mean":
                        df[col] = df[col].fillna(df[col].mean())
                    elif strategy == "mode":
                        df[col] = df[col].fillna(df[col].mode()[0])
                    elif strategy == "zero":
                        df[col] = df[col].fillna(0)
                    elif strategy == "empty_string":
                        df[col] = df[col].fillna("")
                    print(f"  🩹 fill_missing: '{col}' with strategy='{strategy}'")

            elif action == "convert_type":
                col = step.get("column")
                to_type = step.get("to_type")
                if col and col in df.columns:
                    if to_type == "float":
                        df[col] = pd.to_numeric(df[col], errors="coerce")
                    elif to_type == "int":
                        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
                    elif to_type == "str":
                        df[col] = df[col].astype(str)
                    elif to_type == "datetime":
                        # Some pandas versions no longer accept infer_datetime_format kw
                        # Use a simpler call that is broadly compatible
                        df[col] = pd.to_datetime(df[col], errors="coerce")
                    print(f"  🔁 convert_type: '{col}' → {to_type}")

            elif action == "normalize_column_name":
                old = step.get("old_name")
                new = step.get("new_name")
                if old and new and old in df.columns:
                    df = df.rename(columns={old: new})
                    print(f"  ✏️  rename: '{old}' → '{new}'")

        except Exception as e:
            print(f"  ⚠️  Skipping cleaning step {step}: {e}")

    return df


def _normalize_all_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Lowercase and sanitize all column names regardless of LLM output."""
    df.columns = [
        re.sub(r"[^a-z0-9_]", "_", col.strip().lower()).strip("_")
        for col in df.columns
    ]
    # Collapse multiple underscores
    df.columns = [re.sub(r"_+", "_", col) for col in df.columns]
    return df


def _execute_feature_engineering(df: pd.DataFrame, steps: list[dict]) -> pd.DataFrame:
    """Execute LLM-prescribed feature engineering steps."""
    for step in steps:
        action = step.get("action")
        try:
            if action == "extract_year":
                src = step.get("from_column")
                new_col = step.get("new_column", f"{src}_year")
                if src and src in df.columns:
                    df[new_col] = pd.to_datetime(df[src], errors="coerce").dt.year
                    print(f"  📅 extract_year: {src} → {new_col}")

            elif action == "extract_month":
                src = step.get("from_column")
                new_col = step.get("new_column", f"{src}_month")
                if src and src in df.columns:
                    df[new_col] = pd.to_datetime(df[src], errors="coerce").dt.month
                    print(f"  📅 extract_month: {src} → {new_col}")

            elif action == "bin_column":
                col = step.get("column")
                bins = step.get("bins", 4)
                new_col = step.get("new_column", f"{col}_bin")
                if col and col in df.columns:
                    df[new_col] = pd.cut(df[col], bins=bins, labels=False)
                    print(f"  🔢 bin_column: {col} → {new_col} ({bins} bins)")

        except Exception as e:
            print(f"  ⚠️  Skipping feature engineering step {step}: {e}")

    return df


def run_cleaning_agent(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Main entry point.
    Sends a sample of `df` to the LLM, gets cleaning/FE instructions, executes them.
    Returns the cleaned DataFrame and the LLM plan dict.
    """
    sample = df.head(25).to_csv(index=False)
    columns = list(df.columns)
    prompt = _build_cleaning_prompt(sample, columns)

    print("\n🤖 Cleaning Agent → Calling LLM for cleaning plan...")
    try:
        raw_output = call_groq_with_retry(
            messages=[{"role": "user", "content": prompt}],
            model=LLM_MODEL,
            temperature=0.1,
            max_tokens=2048,
            use_cache=True,
        )
        print(f"📋 Raw LLM output:\n{raw_output}\n")
    except Exception as exc:
        print(f"[run_cleaning_agent] LLM call failed: {exc}")
        traceback.print_exc()
        raise ValueError(f"LLM_CALL_FAILED: {exc}")

    try:
        plan = _parse_llm_json(raw_output)
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON parse error: {e}. Using empty plan.")
        plan = {"cleaning_steps": [], "feature_engineering_steps": [], "column_types": {}}

    print("\n🧹 Executing cleaning steps...")
    df = _execute_cleaning_steps(df, plan.get("cleaning_steps", []))

    # Always normalize column names after LLM-driven renames
    df = _normalize_all_column_names(df)

    print("\n⚙️  Executing feature engineering steps...")
    df = _execute_feature_engineering(df, plan.get("feature_engineering_steps", []))

    print(f"\n✅ Cleaning complete → {df.shape[0]} rows × {df.shape[1]} cols")
    return df, plan
