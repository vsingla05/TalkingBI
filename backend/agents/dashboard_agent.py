"""
AGENT 6: Autonomous Dashboard Generation
────────────────────────────────────────
Generates a complete BI experience with 3 themed dashboards, 9-12 charts total,
insights, and voice narration scripts based on the dataset schema.
"""

import json
import re
from config import LLM_MODEL
from .llm_utils import call_groq_with_retry


def _build_auto_dashboard_prompt(table_name: str, schema: str, sample_csv: str) -> str:
    return f"""You are an advanced AI Business Intelligence system.
Your goal is to autonomously generate a complete BI experience from the provided dataset.

TABLE NAME: {table_name}

SCHEMA (column_name, dtype, sample values):
{schema}

SAMPLE DATA (first 25 rows):
{sample_csv}

TASK:
1. Create EXACTLY 3 intelligent dashboards based on the following specific themes:
   - "Executive Overview"
   - "Sales Analytics"
   - "Customer Insights"
2. Each dashboard must have:
   - A perfectly matched title from the list above.
   - A 1-line business-focused description.
   - 3 to 4 charts.
   - 2 key insights (trends, patterns, anomalies) based on what the query data shows.
   - A conversational voice narration script (max 20 seconds) summarizing the dashboard and its insights. Do not sound robotic.
4. For EACH chart, you MUST provide a valid SQLite query to fetch its data, along with axes and type. 
   - ALWAYS use the exact table name: {table_name}
   - CRITICAL: ONLY use columns that explicitly exist in the SCHEMA above. DO NOT invent or hallucinate column names (e.g. do not use "model_year" or "date" unless it is literally in the schema!).
   - You MUST alias aggregation functions (e.g., SUM(revenue) AS total_revenue)
   - Limit query results to 30 rows.
   
Return ONLY valid JSON. No markdown, no extra text.

JSON STRUCTURE:
{{
  "dashboards": [
    {{
      "id": "dash_1",
      "title": "Revenue Performance",
      "description": "High-level summary of sales growth and market distribution.",
      "insights": ["...", "..."],
      "voice_script": "Welcome to the Revenue Performance dashboard. Here we see...",
      "ui": {{
        "layout": "grid",
        "animations": ["fade-in", "hover-scale"]
      }},
      "charts": [
        {{
          "id": "chart_1",
          "title": "Total Revenue by Region",
          "chart_type": "bar",
          "x_axis": "region",
          "y_axis": "total_revenue",
          "sql_query": "SELECT region, SUM(revenue) AS total_revenue FROM {table_name} GROUP BY region ORDER BY total_revenue DESC LIMIT 10"
        }}
      ]
    }}
  ],
  "homepage_layout": {{
    "type": "dashboard_cards",
    "style": ["glassmorphism", "dark_theme"]
  }}
}}
"""


def _extract_json(text: str) -> dict:
    """Try multiple strategies to extract valid JSON from LLM output."""
    text = text.strip()

    # 1. Strip markdown fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    text = text.strip()

    # 2. Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 3. Extract outermost { ... } block and fix trailing commas
    start = text.find('{')
    end = text.rfind('}')
    if start >= 0 and end > start:
        candidate = text[start:end + 1]
        candidate = re.sub(r',(\s*[}\]])', r'\1', candidate)
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract valid JSON from LLM output. First 300 chars:\n{text[:300]}")


def run_auto_dashboard_agent(table_name: str, schema: str, sample_csv: str) -> dict:
    prompt = _build_auto_dashboard_prompt(table_name, schema, sample_csv)

    print("\n🤖 Auto-Dashboard Agent → Calling LLM to generate 3 full dashboards...")
    raw = call_groq_with_retry(
        messages=[{"role": "user", "content": prompt}],
        model=LLM_MODEL,
        temperature=0.2,
        max_tokens=6000,
        use_cache=True,
    )

    try:
        plan = _extract_json(raw)
        print(f"✅ Auto-Dashboard AI generated {len(plan.get('dashboards', []))} dashboards.")
        return plan
    except ValueError as e:
        print(f"❌ JSON parsing failed: {e}")
        raise ValueError(f"Auto-Dashboard Agent returned invalid JSON: {e}")
