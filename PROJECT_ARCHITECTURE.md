# TalkingBI - Complete Project Architecture & Flow

## 🎯 Project Overview

**TalkingBI** is an AI-powered Business Intelligence platform that enables users to:
- Upload CSV datasets
- Ask natural language questions about their data
- Get 4 complementary AI-generated dashboards with insights
- Hear AI voice narration summarizing each dashboard
- Interact with dynamic charts and visualizations

---

## 🏗️ System Architecture (High Level)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION LAYER                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Frontend (React + Vite)                                        │   │
│  │ • Upload CSV                                                   │   │
│  │ • Enter natural language query                                 │   │
│  │ • View 4 dashboards                                            │   │
│  │ • Click dashboard hub to select dashboard                      │   │
│  │ • Play voice narration with pause/resume/stop                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP API ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      API & ROUTING LAYER (FastAPI)                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ POST /upload          - Save CSV to local file                 │   │
│  │ POST /analyze         - Run 7-step pipeline                    │   │
│  │ GET /dataset-status   - Check active dataset                   │   │
│  │ POST /ask-question    - Process follow-up questions            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓ threadpool ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  AGENTIC PIPELINE (7 Steps)                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: Ingest CSV         → Read & parse file                │   │
│  │ STEP 2: Clean Data (LLM)   → Apply LLM-driven cleaning        │   │
│  │ STEP 3: Store in DB        → Save to SQLite                   │   │
│  │ STEP 4: Extract Schema     → Column names, types              │   │
│  │ STEP 5: Generate SQL (LLM) → Write SELECT query for question  │   │
│  │ STEP 6: Execute SQL        → Query data from table            │   │
│  │ STEP 7: Generate 4 Dash    → LLM creates dashboard specs      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓ JSON ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA & STORAGE LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ SQLite Database   - Tables ds_user_{id}                         │   │
│  │ Local Uploads     - uploads/ directory                          │   │
│  │ Redis Cache       - Session dataset links (1 hour TTL)          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete User Journey - Step by Step

### STEP 0: User Authentication & Session
```
User visits frontend
         ↓
[Login/Signup]
         ↓
JWT token issued & stored in localStorage
         ↓
User authenticated in all API calls
```

### STEP 1: Upload CSV Dataset
```
User clicks "Upload Dataset"
         ↓
Browser file picker opened
         ↓
User selects CSV file (e.g., "Sample - Superstore.csv")
         ↓
POST /upload with file
         ↓
Backend saves to: uploads/user{id}_{timestamp}_{filename}.csv
         ↓
Redis stores: active_dataset:{user_id} = "local://uploads/user4_1775401276_Sample - Superstore.csv"
         ↓
Frontend receives dataset_id and stores in state
         ↓
✅ Dataset ready for analysis
```

### STEP 2: User Asks Question
```
User types: "Which category is profitable but has low sales?"
         ↓
User clicks "Ask AI" or presses Enter
         ↓
Frontend constructs AnalyzeRequest:
{
  "dataset_link": "local://uploads/user4_1775401276_Sample - Superstore.csv",
  "query": "Which category is profitable but has low sales?",
  "requested_charts": ["bar", "line", "pie", "area"]
}
         ↓
POST /analyze sent to backend
         ↓
[7-STEP PIPELINE BEGINS - see detailed flow below]
         ↓
Pipeline returns: {"type": "dynamic_dashboards", "dashboards": {...}}
         ↓
Frontend receives and displays 4-dashboard hub
```

---

## 🔄 THE 7-STEP AGENTIC PIPELINE (Detailed)

### ⚙️ STEP 1: INGEST DATASET
**Input:** CSV file path from Redis  
**Output:** Pandas DataFrame with 9994 rows × 21 columns

```python
# ingestion_agent.py
def ingest_data_from_source(source: str) -> pd.DataFrame:
    """
    Handle both remote (Google Sheets) and local CSV files.
    Multi-encoding support: utf-8, latin-1, iso-8859-1, cp1252
    """
    if source.startswith("local://"):
        file_path = source.replace("local://", "")
        # Try multiple encodings to handle diverse CSV files
        for encoding in ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']:
            try:
                df = pd.read_csv(file_path, encoding=encoding)
                return df
            except (UnicodeDecodeError, UnicodeError):
                continue
    # ... handle Google Sheets URLs ...
    
    return df  # 9994 rows × 21 cols loaded successfully
```

**Output Log:**
```
✅ Ingested dataset: 9994 rows × 21 cols from local file
```

---

### 🧹 STEP 2: CLEAN DATA (LLM-Driven)
**Input:** DataFrame sample + column names  
**Process:**
1. Send first 25 rows + schema to Groq LLM
2. LLM returns JSON with cleaning instructions
3. Execute cleaning steps programmatically
4. Normalize all column names

**LLM Prompt Example:**
```
You are an expert data scientist.
Analyze this dataset sample and produce a JSON cleaning plan.

COLUMN NAMES: ["Order ID", "Order Date", "Ship Date", "Ship Mode", ...]

DATASET SAMPLE (first 25 rows): [CSV data]

Return ONLY a valid JSON object:
{
  "cleaning_steps": [
    {"action": "drop_columns", "columns": ["Row ID"]},
    {"action": "convert_type", "column": "Sales", "to_type": "float"},
    {"action": "normalize_column_name", "old_name": "Order ID", "new_name": "order_id"},
    ...
  ],
  "feature_engineering_steps": [
    {"action": "extract_year", "from_column": "order_date", "new_column": "order_year"},
    ...
  ]
}
```

**LLM Output (parsed):**
```json
{
  "cleaning_steps": [
    {"action": "drop_columns", "columns": ["Row ID"]},
    {"action": "convert_type", "column": "Sales", "to_type": "float"},
    {"action": "normalize_column_name", "old_name": "Order ID", "new_name": "order_id"}
  ],
  "feature_engineering_steps": [
    {"action": "extract_year", "from_column": "order_date", "new_column": "order_year"},
    {"action": "extract_month", "from_column": "order_date", "new_column": "order_month"}
  ]
}
```

**Execution:**
```
🧹 Executing cleaning steps...
  🗑️  drop_columns: dropped ['Row ID']
  🔁 convert_type: 'Sales' → float
  ✏️  rename: 'Order ID' → 'order_id'

⚙️  Executing feature engineering steps...
  📅 extract_year: order_date → order_year
  📅 extract_month: order_date → order_month

✅ Cleaning complete → 9994 rows × 22 cols
```

**Output:** Cleaned DataFrame, normalized column names, new features added

---

### 💾 STEP 3: STORE IN DATABASE
**Input:** Cleaned DataFrame  
**Process:** Create SQLite table per user

```python
# storage_agent.py
def store_dataset_in_db(df: pd.DataFrame, user_id: int) -> str:
    """
    Store cleaned dataset in SQLite table named ds_user_{user_id}
    """
    table_name = f"ds_user_{user_id}"
    df.to_sql(table_name, con=engine, if_exists="replace", index=False)
    return table_name
```

**Database Layout:**
```
SQLite Database
├── Table: ds_user_4
│   ├── order_id (TEXT)
│   ├── order_date (TIMESTAMP)
│   ├── ship_date (TIMESTAMP)
│   ├── customer_id (TEXT)
│   ├── customer_name (TEXT)
│   ├── category (TEXT)         ← Key for our query
│   ├── sales (FLOAT)           ← Key for our query
│   ├── profit (FLOAT)          ← Key for our query
│   ├── ... (18 more columns)
│   └── order_year, order_month (new features)
```

**Output Log:**
```
✅ Dataset stored → table='ds_user_4' (9994 rows)
```

---

### 📋 STEP 4: EXTRACT SCHEMA
**Input:** Table name from STEP 3  
**Output:** Schema metadata (column names, types, sample values)

```python
# schema.py
def extract_schema(table_name: str) -> dict:
    """
    Extract table schema and return column info
    """
    columns = [
        {"name": "order_id", "type": "TEXT"},
        {"name": "order_date", "type": "TIMESTAMP"},
        {"name": "customer_name", "type": "TEXT"},
        {"name": "category", "type": "TEXT"},
        {"name": "sales", "type": "FLOAT"},
        {"name": "profit", "type": "FLOAT"},
        ... (18 more)
    ]
    return {"columns": columns, "row_count": 9994}
```

**Output:**
```
order_id (TEXT)
order_date (TIMESTAMP)
ship_date (TIMESTAMP)
...
category (TEXT)
sales (FLOAT)
profit (FLOAT)
order_year (INTEGER)
order_month (INTEGER)
```

---

### 🤖 STEP 5: GENERATE SQL QUERY (LLM)
**Input:** User question + schema  
**Process:** LLM converts natural language → SQL

**LLM Prompt:**
```
You are an expert SQL developer.
User question: "Which category is profitable but has low sales?"

TABLE: ds_user_4
COLUMNS: order_id, order_date, customer_name, category, sales, profit, ...

Write a SQL query to answer the question.
Return ONLY valid JSON (no markdown):
{
  "sql_query": "SELECT ...",
  "chart_mapping": {
    "x_axis": "category",
    "y_axis": "sales",
    "chart_type": "bar",
    "title": "Low Sales but Profitable Categories"
  },
  "reasoning": "..."
}
```

**LLM Output:**
```json
{
  "sql_query": "SELECT category, SUM(sales) AS total_sales, SUM(profit) AS total_profit 
                FROM ds_user_4 
                GROUP BY category 
                ORDER BY total_sales ASC, total_profit DESC",
  "chart_mapping": {
    "x_axis": "category",
    "y_axis": "total_sales",
    "chart_type": "bar",
    "title": "Low Sales but Profitable Categories"
  }
}
```

**Output Log:**
```
✅ SQL Agent plan:
  SQL: SELECT category, SUM(sales) AS total_sales, SUM(profit) AS total_profit 
       FROM ds_user_4 GROUP BY category ORDER BY total_sales ASC, total_profit DESC
  Chart: {'x_axis': 'category', 'y_axis': 'total_sales', 'chart_type': 'bar', ...}
```

---

### 🔍 STEP 6: EXECUTE SQL QUERY
**Input:** SQL query from STEP 5  
**Process:** Execute on SQLite database  
**Output:** Query results

```python
# execution_agent.py
def execute_sql_query(sql_query: str, table_name: str) -> list[dict]:
    """
    Execute SQL query on user's dataset
    """
    with engine.connect() as conn:
        result = pd.read_sql(sql_query, conn)
    return result.to_dict(orient='records')
```

**Query Execution:**
```sql
SELECT category, SUM(sales) AS total_sales, SUM(profit) AS total_profit 
FROM ds_user_4 
GROUP BY category 
ORDER BY total_sales ASC, total_profit DESC
```

**SQL Results (3 rows):**
```
┌─────────────────┬──────────────┬───────────────┐
│ category        │ total_sales  │ total_profit  │
├─────────────────┼──────────────┼───────────────┤
│ Office Supplies │  719,047.03  │  122,490.80   │
│ Furniture       │  741,999.80  │   18,451.27   │
│ Technology      │  836,154.03  │  145,454.95   │
└─────────────────┴──────────────┴───────────────┘
```

**Output Log:**
```
✅ SQL execution returned 3 rows
```

---

### 📊 STEP 7: GENERATE 4 DYNAMIC DASHBOARDS (LLM)
**Input:** User query + SQL results + schema  
**Process:** LLM generates 4 complementary dashboard specifications

**LLM Prompt (simplified):**
```
You are an expert dashboard designer.

USER QUESTION: "Which category is profitable but has low sales?"

QUERY RESULTS:
[
  {"category": "Office Supplies", "total_sales": 719047.03, "total_profit": 122490.80},
  {"category": "Furniture", "total_sales": 741999.80, "total_profit": 18451.27},
  {"category": "Technology", "total_sales": 836154.03, "total_profit": 145454.95}
]

Generate 4 separate dashboards in JSON format:
{
  "kpi_dashboard": {
    "type": "kpi",
    "title": "...",
    "insight": "...",
    "kpis": [4 KPI objects],
    "charts": [4 chart specifications with real data]
  },
  "analytics_dashboard": { ... },
  "performance_dashboard": { ... },
  "insights_dashboard": { ... }
}
```

**LLM Output (4 Dashboards with data enrichment):**

```json
{
  "kpi_dashboard": {
    "type": "kpi",
    "title": "Category Sales and Profit Summary",
    "insight": "Office Supplies has the highest profit at $122K despite mid-range sales.",
    "kpis": [
      {"label": "Total Sales", "value": "$2.3M", "unit": "$", "description": "Total sales across all categories"},
      {"label": "Total Profit", "value": "$360K", "unit": "$", "description": "Total profit across all categories"},
      {"label": "Average Sales per Category", "value": "$770K", "unit": "$"},
      {"label": "Highest Profit Category", "value": "Technology", "unit": ""}
    ],
    "charts": [
      {
        "title": "Total Sales by Category",
        "type": "bar",
        "x_axis": "category",
        "y_axis": "total_sales",
        "description": "Sales for each category",
        "data": [
          {"category": "Office Supplies", "total_sales": 719047.03},
          {"category": "Furniture", "total_sales": 741999.80},
          {"category": "Technology", "total_sales": 836154.03}
        ]
      },
      { ... 3 more charts ... }
    ]
  },
  "analytics_dashboard": { ... 4 KPIs, 4 charts ... },
  "performance_dashboard": { ... 4 KPIs, 4 charts ... },
  "insights_dashboard": { ... 4 KPIs, 4 charts ... }
}
```

**Output Log:**
```
✅ 4 Dashboard specs generated:
  📊 kpi_dashboard: Category Sales and Profit Summary (4 KPIs, 4 charts)
  📊 analytics_dashboard: Detailed Category Analysis (4 KPIs, 4 charts)
  📊 performance_dashboard: Category Performance Metrics (4 KPIs, 4 charts)
  📊 insights_dashboard: Key Category Insights (4 KPIs, 4 charts)
✅ 4 Dynamic dashboards generated
```

---

## 📱 Frontend Flow: Dashboard Rendering

### After Pipeline Returns Data (Step 7 Complete)

```
Backend returns:
{
  "type": "dynamic_dashboards",
  "dashboards": {
    "kpi_dashboard": {...},
    "analytics_dashboard": {...},
    "performance_dashboard": {...},
    "insights_dashboard": {...}
  }
}
         ↓
Frontend receives in runCustomAnalysis() callback
         ↓
State: setDynamicDashboards(payload.dashboards)
         ↓
Render condition checks: if (dynamicDashboards) 
         ↓
DashboardView renders 4-DASHBOARD HUB
         ↓
User sees 4 selectable cards:
┌──────────────────┐  ┌──────────────────┐
│ 📊 KPI Dashboard │  │ 📈 Analytics Db  │
│ 4 cards, 4 viz   │  │ 4 cards, 4 viz   │
└──────────────────┘  └──────────────────┘
┌──────────────────┐  ┌──────────────────┐
│ ⚡ Performance   │  │ 💡 Insights      │
│ 4 cards, 4 viz   │  │ 4 cards, 4 viz   │
└──────────────────┘  └──────────────────┘
         ↓
User clicks on one dashboard (e.g., "KPI Dashboard")
         ↓
State: setSelectedDashboard("kpi")
         ↓
DashboardView renders: <KPIDashboard dashboardData={dashboards.kpi_dashboard} />
         ↓
KPIDashboard component:
  • Displays 4 KPI cards (e.g., "$2.3M Total Sales")
  • Renders 4 charts using Recharts library
  • Shows Play/Pause/Resume/Stop voice buttons
  • User can toggle legend, hover over data, interact with charts
         ↓
User clicks "Play" for voice summary
         ↓
Web Speech API reads dashboard insight aloud
         ↓
User can "Pause", "Resume", or "Stop" narration
```

---

## 🎙️ Voice Narration Feature

```
User clicks Play on dashboard
         ↓
Frontend extracts dashboard text:
  "Category Sales and Profit Summary. 
   Office Supplies has the highest profit at $122K despite mid-range sales."
         ↓
Web Speech API (browser native):
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
         ↓
Browser speaks the text using system voice
         ↓
User can Pause/Resume/Stop at any time
```

---

## 🔐 Authentication & Session Management

```
User logs in with email/password
         ↓
Backend validates credentials
         ↓
JWT token issued with user_id claim
         ↓
Frontend stores token in localStorage
         ↓
Every API request includes: Authorization: Bearer {token}
         ↓
FastAPI dependency get_current_user_id() validates token
         ↓
User_id extracted from token, used to:
  • Name uploaded files: user{id}_{timestamp}_{filename}
  • Create table: ds_user_{id}
  • Store in Redis: active_dataset:{user_id}
         ↓
✅ Session persists for 1 hour (SESSION_TTL)
```

---

## 🛠️ Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, Tailwind CSS | UI Components, Dashboard rendering |
| **Charting** | Recharts | Bar, Line, Area, Pie, Scatter charts |
| **Voice** | Web Speech API | Text-to-speech narration |
| **Backend** | FastAPI (Python 3.12) | REST API, request routing |
| **LLM** | Groq API (llama-3.3-70b-versatile) | Intelligent query generation |
| **Database** | SQLite | Data storage per user |
| **Cache** | Redis | Session management (1 hour TTL) |
| **Data Processing** | Pandas, NumPy | CSV parsing, transformations |

---

## 📈 Key Features

| Feature | How It Works |
|---------|-------------|
| **Multi-Encoding CSV Support** | Tries utf-8, latin-1, iso-8859-1, cp1252 to handle diverse datasets |
| **LLM-Driven Cleaning** | Groq generates customized cleaning plan based on data sample |
| **Natural Language → SQL** | Groq converts user questions directly to SQL queries |
| **4 Complementary Dashboards** | Each dashboard shows different data perspective (KPI, Analytics, Performance, Insights) |
| **Dynamic Data Binding** | Charts pull real SQL data, not mocks |
| **Error Resilience** | LLM calls retry 2x on failure; fallback to controlled error responses |
| **Voice Narration** | Browser Web Speech API reads dashboard insights |
| **Session Persistence** | Redis caches active dataset for 1 hour |

---

## 🚀 Example Query Journey

**User Input:** "Which category is profitable but has low sales?"

**Pipeline Execution:**
```
1. Load CSV: 9994 rows loaded with multi-encoding support
2. Clean: Drop Row ID, convert types, extract year/month from dates → 22 cols
3. Store: Create table ds_user_4 in SQLite
4. Schema: Extract column metadata (21 numeric/text columns)
5. SQL Agent: LLM writes → "SELECT category, SUM(sales), SUM(profit) GROUP BY category"
6. Execute: Query returns 3 categories with their sales and profit
7. Dashboard: LLM generates 4 dashboard specs with real data:
   - KPI: Shows top profit ($145K = Technology)
   - Analytics: Shows low sales leader (Office Supplies = $719K)
   - Performance: Profit margins per category
   - Insights: Profitability vs. sales scatter analysis
```

**Frontend Output:**
```
Dashboard Hub shows 4 cards
User clicks "KPI Dashboard"
  → Displays 4 KPI cards with metrics
  → Shows 4 interactive charts
  → User clicks Play
  → Voice narration reads: "Category Sales and Profit Summary..."
```

---

## 📊 Data Flow Diagram (Text Format)

```
CSV Upload
    ↓
[Step 1] Ingest
    ↓ 9994 rows × 21 cols
[Step 2] Clean (LLM) + Normalize
    ↓ 9994 rows × 22 cols
[Step 3] Store in SQLite
    ↓ ds_user_4 table created
[Step 4] Extract Schema
    ↓ Column metadata
[Step 5] Generate SQL (LLM)
    ↓ SELECT category, SUM(sales), SUM(profit) ...
[Step 6] Execute SQL
    ↓ 3 rows returned
[Step 7] Generate 4 Dashboards (LLM)
    ↓
Dashboard Specs with Real Data
    ├─ kpi_dashboard (4 KPIs, 4 charts)
    ├─ analytics_dashboard (4 KPIs, 4 charts)
    ├─ performance_dashboard (4 KPIs, 4 charts)
    └─ insights_dashboard (4 KPIs, 4 charts)
    ↓
JSON Response to Frontend
    ↓
Dashboard Hub (4 selectable cards)
    ↓
User selects one dashboard
    ↓
Dashboard renders with interactive charts
    ↓
User clicks Play
    ↓
Voice narration via Web Speech API
```

---

## 🎯 Key Differentiators

1. **End-to-End AI**: Every step uses LLM (cleaning, SQL generation, dashboard design)
2. **4 Dashboards**: Multiple perspectives on same data (not just 1 chart)
3. **Voice Narration**: Unique feature for accessibility and passive consumption
4. **Dynamic Data**: All visualizations use real SQL results, not hardcoded mocks
5. **Resilient**: Multi-encoding, retry logic, graceful error handling
6. **User-Isolated**: Per-user tables, Redis sessions, JWT auth

---

## 💾 File Structure Reference

```
TalkingBI/
├── backend/
│   ├── app.py                 # FastAPI app entry point
│   ├── routers/
│   │   └── dataset.py         # /upload, /analyze, /ask-question endpoints
│   ├── agents/
│   │   ├── pipeline.py        # 7-step orchestrator (run_pipeline)
│   │   ├── ingestion_agent.py # STEP 1
│   │   ├── cleaning_agent.py  # STEP 2
│   │   ├── storage_agent.py   # STEP 3
│   │   ├── schema.py          # STEP 4
│   │   ├── sql_agent.py       # STEP 5
│   │   ├── execution_agent.py # STEP 6
│   │   └── dynamic_dashboard_agent.py  # STEP 7
│   ├── database.py            # SQLAlchemy setup
│   └── redis_client.py        # Redis connection
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app routing
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Main analysis page + state
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── components/
│   │   │   ├── DashboardView.jsx          # Dashboard hub + routing
│   │   │   └── dashboards/
│   │   │       ├── KPIDashboard.jsx       # 4 KPIs + 4 charts
│   │   │       ├── AnalyticsDashboard.jsx
│   │   │       ├── PerformanceDashboard.jsx
│   │   │       └── InsightsDashboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT token + user_id
│   │   └── api/
│   │       └── client.js        # axios instance
│   └── package.json
```

---

## ✅ Evaluation Talking Points

1. **Architecture**: 7-step agentic pipeline with LLM at multiple points
2. **AI Integration**: Uses Groq API (llama-3.3-70b-versatile) for intelligent generation
3. **User Experience**: 4 complementary dashboards, voice narration, interactive charts
4. **Resilience**: Multi-encoding support, LLM retry logic, graceful error handling
5. **Full Stack**: React frontend, FastAPI backend, SQLite + Redis, PostgreSQL-optional
6. **Unique Features**: Voice narration with Web Speech API, dynamic dashboard generation per query
7. **Scalability**: Per-user table isolation, session management, can handle multiple concurrent users

---

## 🎬 Demo Scenario for Evaluation

```
1. Show login/signup
2. Upload "Sample - Superstore.csv" (9994 rows)
3. Ask: "Which category is profitable but has low sales?"
4. Show 4-dashboard hub appearing
5. Click KPI Dashboard → Show 4 metrics, 4 interactive charts
6. Click Play → Voice narration reads dashboard summary
7. Click Pause/Resume/Stop to show voice control
8. Show terminal logs of pipeline execution (7 steps with timing)
9. Ask follow-up: "What is the profit margin trend over time?"
10. Show new dashboards generated (same 4 perspectives on new data)
```

---
