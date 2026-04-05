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

Critical SQL Generation Rules:

1️⃣ SEMANTIC MATCHING - Match the user's question intent:
   - "revenue" / "sales" → SUM(transaction_amount) or SUM(revenue)
   - "profit" → SUM(transaction_amount - cost) OR SUM(profit) if exists
   - "cost" → SUM(cost) OR calculate from revenue-profit
   - "average" → AVG(column)
   - "count" / "number of" → COUNT(*)
   - "top/bottom" → ORDER BY DESC/ASC

2️⃣ CALCULATION RULES:
   - Profit MUST be: Revenue - Cost (never just revenue)
   - If profit column exists, use it: SUM(profit)
   - If only revenue and cost exist, calculate: SUM(revenue - cost) AS profit
   - For margin/percentage: (SUM(revenue - cost) / SUM(revenue)) * 100 AS profit_margin
   - ALWAYS use aliases for calculated columns

3️⃣ SQL BEST PRACTICES:
   - Use the EXACT table name: {table_name}
   - Use EXACT column names from schema (case-sensitive)
   - Valid SQLite syntax only
   - Pick chart_type that best matches from requested list
   - Use GROUP BY for all aggregations
   - ORDER BY to show meaningful order
   - Limit to 50 rows max
   - No subqueries unless necessary
   - Use descriptive aliases (e.g., SUM(revenue) AS total_revenue)

4️⃣ COMMON BUSINESS METRICS:
   - Total Sales: SUM(transaction_amount)
   - Total Profit: SUM(revenue - cost) or SUM(profit)
   - Profit Margin: (SUM(profit) / SUM(revenue)) * 100
   - Average Order Value: AVG(transaction_amount)
   - Customer Count: COUNT(DISTINCT customer_id)
   - Return on Investment: (SUM(profit) / SUM(cost)) * 100

5️⃣ DATE/TIME HANDLING:
   - If grouping by date_year, date_month, etc. → ORDER BY that column ASC
   - Format results for trends/time-series charts
   - Latest data should be at the end for line charts

Example transformations:
❌ Wrong: "What is profit?" → SELECT SUM(revenue) ... (missing cost)
✅ Correct: "What is profit?" → SELECT SUM(revenue - cost) AS total_profit ...

❌ Wrong: "Profit trend" → GROUP BY date_year, SUM(revenue) ...
✅ Correct: "Profit trend" → GROUP BY date_year, SUM(revenue - cost) AS profit ORDER BY date_year ...

Return JSON only"""


def _parse_llm_json(llm_output: str) -> dict:
    text = llm_output.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    return json.loads(text.strip())


def _validate_sql_semantics(sql_query: str, user_query: str, schema: str) -> tuple[bool, str]:
    """
    Validate that SQL query semantically matches the user's question.
    
    Returns:
        (is_valid, warning_message)
    """
    sql_upper = sql_query.upper()
    query_lower = user_query.lower()
    warnings = []
    
    # Check for profit-related questions
    if any(word in query_lower for word in ["profit", "net income", "profitability"]):
        # Profit should include cost subtraction
        if "profit" not in sql_upper:
            # Check if manually calculating profit as revenue - cost
            if "(" not in sql_upper or "-" not in sql_upper:
                warnings.append("⚠️ SEMANTIC WARNING: Question asks for PROFIT but SQL might only show REVENUE. Ensure SQL calculates: SUM(revenue - cost) AS profit")
    
    # Check for cost-related questions
    if any(word in query_lower for word in ["cost", "expense", "spending"]):
        if "cost" not in sql_upper and "expense" not in sql_upper:
            warnings.append("⚠️ SEMANTIC WARNING: Question asks for COST but SQL doesn't reference cost columns")
    
    # Check for margin/ratio questions
    if any(word in query_lower for word in ["margin", "ratio", "percentage", "%"]):
        if "/ " not in sql_upper and "*" not in sql_upper and "%" not in sql_upper:
            warnings.append("⚠️ SEMANTIC WARNING: Question asks for ratio/percentage/margin but SQL might not be calculating division")
    
    # Check for trend questions
    if any(word in query_lower for word in ["trend", "over time", "progression", "growth"]):
        if "order by" not in sql_upper:
            warnings.append("⚠️ SEMANTIC WARNING: Question asks for TREND but SQL missing ORDER BY clause")
        if not any(date_col in sql_upper for date_col in ["DATE", "YEAR", "MONTH", "WEEK"]):
            warnings.append("⚠️ SEMANTIC WARNING: Question asks for TREND but no date/time column in SQL")
    
    # Check for aggregation consistency
    if "group by" in sql_upper:
        # If GROUP BY exists, should have SUM/AVG/COUNT/MAX/MIN
        if not any(agg in sql_upper for agg in ["SUM(", "AVG(", "COUNT(", "MAX(", "MIN("]):
            warnings.append("⚠️ SEMANTIC WARNING: SQL has GROUP BY but no aggregation function (SUM, AVG, COUNT, etc.)")
    
    # Check for top/bottom questions
    if any(word in query_lower for word in ["top ", "bottom ", "highest", "lowest", "best", "worst"]):
        if "order by" not in sql_upper or "limit" not in sql_upper:
            warnings.append("⚠️ SEMANTIC WARNING: Question asks for TOP/BOTTOM but SQL missing ORDER BY or LIMIT")
    
    if warnings:
        return False, " | ".join(warnings)
    return True, ""


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
    Validates semantic correctness and warns about potential issues.
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

    # Validate semantic correctness of SQL
    is_semantically_valid, warning_msg = _validate_sql_semantics(
        plan['sql_query'], user_query, schema
    )
    
    if not is_semantically_valid:
        print(f"⚠️ {warning_msg}")
        # Log warning but don't fail - let execution reveal issues
        plan["semantic_warnings"] = warning_msg
    else:
        print(f"✅ SQL semantically validated")

    print(f"✅ SQL Agent plan:\n  SQL: {plan['sql_query']}\n  Chart: {plan['chart_mapping']}")
    if "semantic_warnings" in plan:
        print(f"  ⚠️ Warnings: {plan['semantic_warnings']}")
    
    return plan
