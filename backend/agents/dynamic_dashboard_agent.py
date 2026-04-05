"""
DYNAMIC DASHBOARD GENERATOR AGENT (4 Dashboards)
────────────────────────────────────────────────
Generates 4 context-aware dashboards with multiple charts and KPIs based on:
1. User's question (intent)
2. Actual data from SQL results
3. Available columns in dataset

Returns 4 fully dynamic dashboard specifications:
- KPI Dashboard: Key metrics and highlights
- Analytics Dashboard: Detailed analysis and trends
- Performance Dashboard: Performance metrics and comparisons
- Insights Dashboard: Key insights and findings
"""

import json
import re
import time
import traceback
import math
from groq import Groq
from config import GROQ_API_KEY, LLM_MODEL


def sanitize_value(value):
    """Convert NaN, None, and invalid values to 0."""
    if value is None:
        return 0
    
    try:
        num = float(value)
        # Check for NaN or infinity
        if math.isnan(num) or math.isinf(num):
            return 0
        return num
    except (ValueError, TypeError):
        return 0


def sanitize_dict(obj):
    """Recursively sanitize dictionary to remove NaN values."""
    if isinstance(obj, dict):
        return {key: sanitize_dict(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_dict(item) for item in obj]
    elif isinstance(obj, float):
        return sanitize_value(obj)
    else:
        return obj


def _build_four_dashboards_prompt(
    user_query: str,
    table_schema: str,
    sample_data: str,
    sql_results: list[dict],
) -> str:
    """Build prompt for LLM to generate 4 dashboard specifications."""
    
    sample_records = json.dumps(sql_results[:10], indent=2, default=str)
    
    return f"""You are an expert dashboard designer. Generate 4 complementary dashboards from the user's question and data.

USER QUESTION: "{user_query}"

QUERY RESULTS (first 10 rows):
{sample_records}

TABLE SCHEMA:
{table_schema}

Generate 4 separate dashboard specifications in this exact JSON format:
{{
    "kpi_dashboard": {{
        "type": "kpi",
        "title": "<KPI Summary Title>",
        "insight": "<1-sentence key finding>",
        "kpis": [
            {{"label": "<name>", "value": "<value>", "unit": "$", "change": "+X%", "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": "-X%", "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": "+X%", "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": "+X%", "description": "<desc>"}}
        ],
        "charts": [
            {{"title": "<chart title>", "type": "bar", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart title>", "type": "pie", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart title>", "type": "area", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart title>", "type": "line", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}}
        ]
    }},
    "analytics_dashboard": {{
        "type": "analytics",
        "title": "<Detailed Analysis Title>",
        "insight": "<1-sentence summary>",
        "kpis": [
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}}
        ],
        "charts": [
            {{"title": "<chart>", "type": "bar", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "line", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "area", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "scatter", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}}
        ]
    }},
    "performance_dashboard": {{
        "type": "performance",
        "title": "<Performance Metrics Title>",
        "insight": "<1-sentence performance summary>",
        "kpis": [
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}}
        ],
        "charts": [
            {{"title": "<chart>", "type": "bar", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "line", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "pie", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "area", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}}
        ]
    }},
    "insights_dashboard": {{
        "type": "insights",
        "title": "<Key Insights Title>",
        "insight": "<1-sentence main insight>",
        "kpis": [
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}},
            {{"label": "<name>", "value": "<value>", "unit": "", "change": null, "description": "<desc>"}}
        ],
        "charts": [
            {{"title": "<chart>", "type": "pie", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "bar", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "line", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}},
            {{"title": "<chart>", "type": "area", "x_axis": "<field>", "y_axis": "<field>", "description": "<desc>"}}
        ]
    }}
}}

IMPORTANT:
- Each dashboard must have EXACTLY 4 KPI cards
- Each dashboard must have EXACTLY 4 charts
- All metrics and columns must exist in the results
- All KPI values must be actual numbers formatted as strings (e.g. "$5K", "1,234", "45%")
- Use realistic percentages for "change" field (e.g., "+15%", "-8%", null if not applicable)
- Each dashboard should focus on a different angle of the data
- Chart titles should be descriptive and unique per dashboard
- Use only these chart types: bar, line, area, pie, scatter
- For "unit" field use: "$", "%", "units", "count", "" for no unit

KPI VALUE FORMATTING RULES:
- Money: "$5,000", "$1.2M", "$450.50"
- Percentage: "45%", "85.5%"
- Count: "1,234", "50,000"
- Decimal: "4.5", "12.8"
- String: Any value from data

Return ONLY the JSON object with NO markdown, NO explanation, NO extra text."""


def _parse_dashboards_json(llm_output: str) -> dict:
    """Parse JSON from LLM output, handling markdown formatting and common JSON errors."""
    text = llm_output.strip()
    
    # Remove markdown code blocks
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    text = text.strip()
    
    # Remove any excessive whitespace while preserving structure
    lines = text.split('\n')
    text = '\n'.join(line.rstrip() for line in lines)
    
    # Fix common JSON issues from LLM output
    # 1. Fix commas right after opening braces: {, → {
    text = re.sub(r'\{\s*,', '{', text)
    
    # 2. Fix commas right after opening brackets: [, → [
    text = re.sub(r'\[\s*,', '[', text)
    
    # 3. Fix missing commas between object properties
    # Look for: "key": value\n"nextkey" and add comma
    text = re.sub(r'(":\s*[^,\}\]]*)\n(\s*")', r'\1,\n\2', text)
    
    # 4. Fix missing commas in arrays (after closing braces)
    # Look for: {...}\n{... and add comma
    text = re.sub(r'(\})\s*\n(\s*\{)', r'\1,\n\2', text)
    
    # 5. Fix missing commas after closing brackets
    # Look for: [...]\n[... and add comma  
    text = re.sub(r'(\])\s*\n(\s*\[)', r'\1,\n\2', text)
    
    # 6. Fix trailing commas before closing brackets/braces
    text = re.sub(r',(\s*[\}\]])', r'\1', text)
    
    # 7. Try to parse
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        # Extract just the JSON object and try again
        start = text.find('{')
        end = text.rfind('}')
        if start >= 0 and end > start:
            extracted = text[start:end+1]
            # Reapply fixes to extracted text
            extracted = re.sub(r'\{\s*,', '{', extracted)
            extracted = re.sub(r'\[\s*,', '[', extracted)
            extracted = re.sub(r',(\s*[\}\]])', r'\1', extracted)
            try:
                return json.loads(extracted)
            except json.JSONDecodeError as e2:
                raise ValueError(f"Failed to parse JSON: {e2}")
        raise ValueError(f"Could not extract JSON: {e}")


def generate_four_dashboards(
    user_query: str,
    table_schema: str,
    sample_data: str,
    sql_results: list[dict],
) -> dict:
    """
    Generate 4 dynamic dashboards based on user query and SQL results.
    
    Parameters
    ----------
    user_query : str
        The user's natural language question
    table_schema : str
        SQL schema of the table
    sample_data : str
        Sample CSV data
    sql_results : list[dict]
        Results from SQL query execution
    
    Returns
    -------
    dict with keys: kpi_dashboard, analytics_dashboard, performance_dashboard, insights_dashboard
    """
    
    print("🎨 Dynamic Dashboard Agent → Calling LLM...")
    
    # Build prompt
    prompt = _build_four_dashboards_prompt(user_query, table_schema, sample_data, sql_results)
    
    # Call Groq LLM
    client = Groq(api_key=GROQ_API_KEY)
    # Retry LLM call up to 2 times to handle transient errors
    llm_output = None
    attempts = 2
    for attempt in range(1, attempts + 1):
        try:
            response = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=4000,
            )
            llm_output = response.choices[0].message.content
            print(f"📋 Dashboard Agent raw output:\n{llm_output[:500]}...\n")
            break
        except Exception as exc:
            print(f"[generate_four_dashboards] LLM call failed (attempt {attempt}/{attempts}): {exc}")
            traceback.print_exc()
            if attempt < attempts:
                time.sleep(1)
                continue
            raise ValueError(f"LLM_CALL_FAILED: {exc}")
    
    # Parse response with error handling
    try:
        dashboards_spec = _parse_dashboards_json(llm_output)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"❌ Failed to parse dashboards JSON: {e}")
        print(f"📋 Full LLM output for debugging:\n{llm_output}\n")
        raise ValueError(f"Invalid JSON from LLM: {e}")
    
    return dashboards_spec


def enrich_dashboards_with_data(
    dashboards_spec: dict,
    sql_results: list[dict],
) -> dict:
    """
    Enrich dashboard specifications with actual SQL result data.
    
    Parameters
    ----------
    dashboards_spec : dict
        Dashboard specifications from LLM
    sql_results : list[dict]
        Actual query results
    
    Returns
    -------
    dict with enriched dashboard data
    """
    
    if not sql_results:
        print("⚠️  No SQL results to enrich dashboards with")
        sql_results = []
    
    enriched = {}
    
    for dashboard_type in ["kpi_dashboard", "analytics_dashboard", "performance_dashboard", "insights_dashboard"]:
        if dashboard_type not in dashboards_spec:
            continue
        
        dashboard = dashboards_spec[dashboard_type]
        
        # Add REAL data to charts
        for chart in dashboard.get("charts", []):
            x_axis = chart.get("x_axis")
            y_axis = chart.get("y_axis")
            
            # Extract data for this specific chart from SQL results
            if x_axis and y_axis and sql_results:
                chart_data = []
                for result in sql_results:
                    data_point = {}
                    # Copy x_axis and y_axis values if they exist
                    if x_axis in result:
                        data_point[x_axis] = result[x_axis]
                    if y_axis in result:
                        data_point[y_axis] = result[y_axis]
                    
                    # Also include any numeric columns for multi-series charts
                    for key, value in result.items():
                        if isinstance(value, (int, float)) and key not in [x_axis, y_axis]:
                            data_point[key] = value
                        elif key not in [x_axis, y_axis]:
                            data_point[key] = value
                    
                    if x_axis in data_point or y_axis in data_point:
                        chart_data.append(data_point)
                
                # Use real data if available, otherwise use all results
                chart["data"] = chart_data if chart_data else sql_results
                print(f"  📊 {dashboard_type} / {chart['title']}: {len(chart['data'])} data points")
            else:
                # Fallback: use all SQL results
                chart["data"] = sql_results
                print(f"  📊 {dashboard_type} / {chart['title']}: {len(sql_results)} data points (fallback)")
        
        enriched[dashboard_type] = dashboard
    
    return enriched
                

def _compute_kpi_values(kpis: list[dict], sql_results: list[dict]) -> list[dict]:
    """
    Compute real KPI values from SQL results.
    Extract numeric columns and compute statistics to populate KPI values.
    """
    if not sql_results or not kpis:
        return kpis
    
    # Find all numeric columns in results
    numeric_columns = {}
    for result in sql_results:
        for key, value in result.items():
            if isinstance(value, (int, float)):
                if key not in numeric_columns:
                    numeric_columns[key] = []
                numeric_columns[key].append(value)
    
    # Compute statistics
    stats = {}
    for col, values in numeric_columns.items():
        if values:
            stats[col] = {
                'total': sum(values),
                'count': len(values),
                'avg': sum(values) / len(values),
                'max': max(values),
                'min': min(values),
            }
    
    # Update KPI values with real computed values
    for i, kpi in enumerate(kpis):
        if i < len(stats):
            # Get ith statistic
            stat_cols = list(stats.keys())
            if i < len(stat_cols):
                col_name = stat_cols[i]
                col_stats = stats[col_name]
                
                # Format value based on what it represents
                if col_stats['total'] > 1000000:
                    kpi['value'] = f"${col_stats['total']/1000000:.1f}M"
                elif col_stats['total'] > 1000:
                    kpi['value'] = f"${col_stats['total']/1000:.0f}K"
                else:
                    kpi['value'] = f"{col_stats['total']:,.0f}"
                
                # Set description to show what this metric is
                kpi['description'] = f"{col_name} across all records"
    
    return kpis


def generate_four_dashboards_complete(
    user_query: str,
    table_schema: str,
    sample_data: str,
    sql_results: list[dict],
) -> dict:
    """
    Generate and enrich 4 complete dashboards ready for frontend rendering.
    """
    
    # Generate dashboard specifications
    dashboards_spec = generate_four_dashboards(
        user_query=user_query,
        table_schema=table_schema,
        sample_data=sample_data,
        sql_results=sql_results,
    )
    
    # Enrich with data
    enriched_dashboards = enrich_dashboards_with_data(dashboards_spec, sql_results)
    
    # Compute real KPI values from SQL results
    for dashboard_type, dashboard in enriched_dashboards.items():
        if 'kpis' in dashboard:
            dashboard['kpis'] = _compute_kpi_values(dashboard['kpis'], sql_results)
    
    print(f"✅ 4 Dashboard specs generated:")
    for dashboard_type, dashboard in enriched_dashboards.items():
        print(f"  📊 {dashboard_type}: {dashboard.get('title')}")
        print(f"     KPIs: {len(dashboard.get('kpis', []))}, Charts: {len(dashboard.get('charts', []))}")
        print(f"     KPI Values: {[kpi.get('value') for kpi in dashboard.get('kpis', [])]}")
    
    # Sanitize all data to remove NaN values before returning
    sanitized_dashboards = sanitize_dict(enriched_dashboards)
    
    return sanitized_dashboards
