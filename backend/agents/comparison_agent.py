"""
COMPARISON AGENT
────────────────
Automatically generates all relevant comparisons, relationships, and metrics 
based on the dataset schema. Discovers numeric/categorical fields and creates 
intelligent visualizations without user prompting.

Examples:
  - Revenue vs Profit comparison
  - Customer segments by revenue
  - Loss vs Profit trends
  - Sales by region/category
  - Top customers by revenue
"""

import os
import json
import re
from typing import List, Dict, Any
from .llm_utils import call_groq_with_retry

def analyze_schema(schema: str, sample_csv: str) -> Dict[str, Any]:
    """
    Analyze schema to identify numeric, categorical, and datetime fields.
    Returns structured field information.
    
    Args:
        schema: Schema description from database
        sample_csv: Sample data to infer field types
    
    Returns:
        {
            "numeric_fields": ["revenue", "profit", "sales", ...],
            "categorical_fields": ["region", "product", "category", ...],
            "datetime_fields": ["date", "month", ...],
            "field_descriptions": {...}
        }
    """
    print("[Comparison Agent] Analyzing schema for fields...")
    
    prompt = f"""Analyze this dataset schema and sample data. Identify all fields and classify them.

SCHEMA:
{schema}

SAMPLE DATA:
{sample_csv}

Return ONLY valid JSON (no markdown, no code blocks):
{{
  "numeric_fields": ["field1", "field2", ...],
  "categorical_fields": ["field1", "field2", ...],
  "datetime_fields": ["field1", "field2", ...],
  "field_descriptions": {{
    "field_name": "description of what this field represents"
  }}
}}

Be accurate. Only include fields that actually exist in the schema."""

    raw = call_groq_with_retry(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1000,
        use_cache=True,
    )
    result_text = raw.strip()
    
    # Remove markdown code blocks if present
    result_text = re.sub(r'^```(?:json)?\n?', '', result_text)
    result_text = re.sub(r'\n?```$', '', result_text)
    
    try:
        field_analysis = json.loads(result_text)
        print(f"  ✓ Found {len(field_analysis.get('numeric_fields', []))} numeric fields")
        print(f"  ✓ Found {len(field_analysis.get('categorical_fields', []))} categorical fields")
        return field_analysis
    except json.JSONDecodeError:
        print(f"  ⚠️ Failed to parse field analysis: {result_text}")
        return {
            "numeric_fields": [],
            "categorical_fields": [],
            "datetime_fields": [],
            "field_descriptions": {}
        }


def generate_comparison_queries(field_analysis: Dict[str, Any], table_name: str) -> List[Dict[str, str]]:
    """
    Generate SQL queries for all relevant comparisons based on identified fields.
    
    Examples:
      - SUM(revenue) by category
      - AVG(profit) by region
      - revenue - profit as loss/margin
      - Top 10 customers by revenue
    
    Args:
        field_analysis: Output from analyze_schema()
        table_name: Database table name
    
    Returns:
        List of query specifications with type, SQL, chart_type
    """
    print("[Comparison Agent] Generating comparison queries...")
    
    numeric = field_analysis.get("numeric_fields", [])
    categorical = field_analysis.get("categorical_fields", [])
    
    queries = []
    
    # 1. Sum/Total of each numeric field
    for field in numeric:
        queries.append({
            "name": f"Total {field.title()}",
            "type": "metric_card",
            "sql": f"SELECT SUM({field}) as total_{field} FROM {table_name}",
            "display_field": f"total_{field}",
            "metric_type": "total"
        })
    
    # 2. Average of each numeric field
    for field in numeric:
        queries.append({
            "name": f"Average {field.title()}",
            "type": "metric_card",
            "sql": f"SELECT AVG({field}) as avg_{field}, COUNT(*) as count FROM {table_name}",
            "display_field": f"avg_{field}",
            "metric_type": "average"
        })
    
    # 3. Numeric field by categorical field comparisons (bar/column charts)
    for num_field in numeric:
        for cat_field in categorical:
            if len(categorical) > 0:  # Only if we have categorical fields
                queries.append({
                    "name": f"{num_field.title()} by {cat_field.title()}",
                    "type": "comparison_chart",
                    "sql": f"SELECT {cat_field}, SUM({num_field}) as total FROM {table_name} GROUP BY {cat_field} ORDER BY total DESC LIMIT 20",
                    "chart_type": "bar",
                    "x_axis": cat_field,
                    "y_axis": "total"
                })
    
    # 4. Multiple numeric fields comparison (if we have 2+ numeric fields)
    if len(numeric) >= 2:
        # Pick first two numeric fields for comparison
        field1, field2 = numeric[0], numeric[1]
        queries.append({
            "name": f"{field1.title()} vs {field2.title()} Comparison",
            "type": "comparison_chart",
            "sql": f"SELECT {field1}, {field2} FROM {table_name} LIMIT 100",
            "chart_type": "scatter",
            "x_axis": field1,
            "y_axis": field2
        })
    
    # 5. Calculated metrics (profit margin, growth rate, etc.)
    if "revenue" in [f.lower() for f in numeric] and "profit" in [f.lower() for f in numeric]:
        rev_field = next((f for f in numeric if f.lower() == "revenue"), numeric[0])
        prof_field = next((f for f in numeric if f.lower() == "profit"), numeric[1] if len(numeric) > 1 else numeric[0])
        
        queries.append({
            "name": f"Profit Margin Analysis",
            "type": "comparison_chart",
            "sql": f"SELECT {rev_field}, {prof_field}, ({prof_field} * 100.0 / {rev_field}) as margin FROM {table_name} WHERE {rev_field} > 0 LIMIT 100",
            "chart_type": "scatter",
            "x_axis": rev_field,
            "y_axis": "margin"
        })
    
    # 6. Top performers (if we have both numeric and categorical)
    for num_field in numeric[:2]:  # Limit to first 2 numeric fields
        for cat_field in categorical[:2]:  # Limit to first 2 categorical fields
            queries.append({
                "name": f"Top {cat_field.title()} by {num_field.title()}",
                "type": "top_performers",
                "sql": f"SELECT {cat_field}, SUM({num_field}) as total FROM {table_name} GROUP BY {cat_field} ORDER BY total DESC LIMIT 10",
                "chart_type": "bar",
                "x_axis": cat_field,
                "y_axis": "total",
                "metadata": {"show_as": "card_with_chart"}
            })
    
    print(f"  ✓ Generated {len(queries)} comparison queries")
    return queries


def generate_comparison_cards(query_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert query results into visual card components.
    
    Args:
        query_results: List of executed query results with data
    
    Returns:
        List of card specifications for frontend rendering
    """
    print("[Comparison Agent] Generating comparison cards...")
    
    cards = []
    
    for result in query_results:
        result_type = result.get("type", "unknown")
        
        if result_type == "metric_card":
            # Single metric card (total, average, etc.)
            cards.append({
                "card_type": "metric",
                "title": result.get("name"),
                "metric_type": result.get("metric_type", "value"),
                "value": result.get("value"),
                "unit": result.get("unit", ""),
                "icon": get_icon_for_metric(result.get("metric_type", "")),
                "change": result.get("change", None)
            })
        
        elif result_type == "comparison_chart":
            # Chart card (bar, line, scatter, etc.)
            cards.append({
                "card_type": "chart",
                "title": result.get("name"),
                "chart_type": result.get("chart_type", "bar"),
                "data": result.get("data", []),
                "x_axis": result.get("x_axis"),
                "y_axis": result.get("y_axis"),
                "metadata": result.get("metadata", {})
            })
        
        elif result_type == "top_performers":
            # Top performers card with mini chart
            cards.append({
                "card_type": "top_performers",
                "title": result.get("name"),
                "items": result.get("data", [])[:10],
                "chart_type": "bar",
                "data": result.get("data", [])[:10]
            })
    
    print(f"  ✓ Generated {len(cards)} comparison cards")
    return cards


def get_icon_for_metric(metric_type: str) -> str:
    """Map metric types to appropriate icons."""
    icons = {
        "total": "📊",
        "average": "📈",
        "max": "🔝",
        "min": "🔻",
        "count": "🔢",
        "percentage": "%",
        "revenue": "💰",
        "profit": "💵",
        "loss": "📉"
    }
    return icons.get(metric_type, "📋")


def sanitize_value(value):
    """Convert NaN, None, and invalid values to 0."""
    import math
    
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


def sanitize_data(data: List[Dict]) -> List[Dict]:
    """Recursively sanitize all float values in data to handle NaN."""
    if not data:
        return data
    
    sanitized = []
    for row in data:
        sanitized_row = {}
        for key, value in row.items():
            if isinstance(value, float):
                sanitized_row[key] = sanitize_value(value)
            else:
                sanitized_row[key] = value
        sanitized.append(sanitized_row)
    
    return sanitized


def execute_comparison_queries(queries: List[Dict[str, str]], execute_sql_func) -> List[Dict[str, Any]]:
    """
    Execute all comparison queries and format results.
    
    Args:
        queries: List of query specifications
        execute_sql_func: Function to execute SQL queries
    
    Returns:
        List of results with data and metadata
    """
    print("[Comparison Agent] Executing comparison queries...")
    
    results = []
    
    for query_spec in queries:
        try:
            sql = query_spec.get("sql")
            if not sql:
                continue
            
            data = execute_sql_func(sql)
            
            # Sanitize data to remove NaN values
            data = sanitize_data(data) if data else []
            
            result = {
                "name": query_spec.get("name"),
                "type": query_spec.get("type"),
                "chart_type": query_spec.get("chart_type"),
                "x_axis": query_spec.get("x_axis"),
                "y_axis": query_spec.get("y_axis"),
                "data": data,
                "metric_type": query_spec.get("metric_type"),
                "unit": query_spec.get("unit", ""),
                "metadata": query_spec.get("metadata", {})
            }
            
            # For metric cards, extract single value
            if query_spec.get("type") == "metric_card" and data and len(data) > 0:
                display_field = query_spec.get("display_field")
                if display_field and display_field in data[0]:
                    result["value"] = sanitize_value(data[0][display_field])
            
            results.append(result)
            print(f"  ✓ Executed: {query_spec.get('name')}")
        
        except Exception as e:
            print(f"  ⚠️ Failed to execute query for {query_spec.get('name')}: {e}")
            continue
    
    return results


def run_comparison_agent(table_name: str, schema: str, sample_csv: str, execute_sql_func) -> Dict[str, Any]:
    """
    Main comparison agent function. Orchestrates the full comparison generation.
    
    Args:
        table_name: Database table name
        schema: Schema description from database
        sample_csv: Sample data
        execute_sql_func: Function to execute SQL queries
    
    Returns:
        {
            "comparisons": [
                {"name": "...", "type": "metric_card|comparison_chart|top_performers", "data": [...]}
            ],
            "cards": [
                {"card_type": "metric|chart|top_performers", "title": "...", ...}
            ],
            "field_analysis": {...}
        }
    """
    print("\n" + "="*60)
    print("🔍 COMPARISON AGENT START")
    print("="*60)
    
    try:
        # Step 1: Analyze schema
        field_analysis = analyze_schema(schema, sample_csv)
        
        # Step 2: Generate queries for comparisons
        queries = generate_comparison_queries(field_analysis, table_name)
        
        # Step 3: Execute queries
        results = execute_comparison_queries(queries, execute_sql_func)
        
        # Step 4: Generate card specifications
        cards = generate_comparison_cards(results)
        
        print("✅ Comparison Agent Complete\n")
        
        return {
            "comparisons": results,
            "cards": cards,
            "field_analysis": field_analysis
        }
    
    except Exception as e:
        print(f"❌ Comparison Agent Failed: {e}")
        return {
            "comparisons": [],
            "cards": [],
            "field_analysis": {}
        }
