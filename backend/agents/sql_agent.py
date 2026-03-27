"""
AGENT 3: SQL Query Generation (LLM-driven)
───────────────────────────────────────────
Sends schema + sample + user query + requested chart types to the LLM.
LLM returns a structured JSON with the SQL query and chart mapping.

LLM JSON Contract:
{
    "sql_query": "SELECT region, SUM(revenue) AS total_revenue FROM ds_user_1 GROUP BY region ORDER BY total_revenue DESC",
    "chart_mapping": {
        "x_axis": "region",
        "y_axis": "total_revenue",
        "chart_type": "bar",
        "title": "Total Revenue by Region"
    },
    "reasoning": "..."   (ignored, just for LLM transparency)
}
"""

import json
import re
from groq import Groq
from config import GROQ_API_KEY, LLM_MODEL


def _build_sql_prompt(
    table_name: str,
    schema: str,
    sample_csv: str,
    user_query: str,
    requested_charts: list[str],
) -> str:
    charts_str = ", ".join(requested_charts)
    return f"""You are an expert SQL analyst and data visualization engineer.

Given the following database table, generate a precise SQL query to answer the user's question and recommend the best chart mapping.

TABLE NAME: {table_name}

SCHEMA (column_name, dtype, sample values):
{schema}

SAMPLE DATA (first 25 rows):
{sample_csv}

USER QUESTION: "{user_query}"

REQUESTED CHART TYPES: [{charts_str}]

Return ONLY valid JSON with NO markdown, NO explanation, NO extra text. Use exactly this structure:
{{
    "sql_query": "<valid SQLite SELECT query using table '{table_name}'>",
    "chart_mapping": {{
        "x_axis": "<column_name for X axis>",
        "y_axis": "<column_name for Y axis or aggregated alias>",
        "chart_type": "<one of: {charts_str}>",
        "title": "<short descriptive chart title>"
    }},
    "reasoning": "<1 sentence explanation>"
}}

Critical rules:
- Use the EXACT table name: {table_name}
- Use EXACT column names from the schema above (case-sensitive)
- SQL must be valid SQLite syntax
- Pick the chart_type that best matches the query from the requested list
- Always use GROUP BY when aggregating
- Limit to 50 rows max
- Do NOT use subqueries unless absolutely necessary
- Alias aggregated columns (e.g., SUM(revenue) AS total_revenue)
- Return JSON only"""


def _parse_llm_json(llm_output: str) -> dict:
    text = llm_output.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    return json.loads(text.strip())


def run_sql_agent(
    table_name: str,
    schema: str,
    sample_csv: str,
    user_query: str,
    requested_charts: list[str],
) -> dict:
    """
    Call the LLM to generate a SQL query + chart mapping.
    Returns the parsed JSON plan dict.
    """
    prompt = _build_sql_prompt(table_name, schema, sample_csv, user_query, requested_charts)
    client = Groq(api_key=GROQ_API_KEY)

    print("\n🤖 SQL Agent → Calling LLM for query plan...")
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,   # Deterministic for SQL
        max_tokens=1024,
    )

    raw_output = response.choices[0].message.content
    print(f"📋 SQL Agent raw output:\n{raw_output}\n")

    try:
        plan = _parse_llm_json(raw_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"SQL Agent returned invalid JSON: {e}\nRaw: {raw_output[:300]}")

    required_keys = {"sql_query", "chart_mapping"}
    if not required_keys.issubset(plan):
        raise ValueError(f"SQL Agent JSON missing keys {required_keys - set(plan.keys())}")

    print(f"✅ SQL Agent plan:\n  SQL: {plan['sql_query']}\n  Chart: {plan['chart_mapping']}")
    return plan
