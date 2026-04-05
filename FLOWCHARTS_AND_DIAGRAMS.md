# TalkingBI - Visual Flowchart & Sequence Diagrams

## 1️⃣ Complete System Flowchart

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER (Browser)                                  │
└────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ↓                     ↓                     ↓
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │   Login/Signup   │  │  Upload Dataset  │  │  Ask Question    │
        │   (JWT Token)    │  │  (CSV File)      │  │  (Natural Lang)  │
        └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
                 │                     │                     │
                 │ Token Stored        │ POST /upload        │ POST /analyze
                 │ in localStorage     │                     │
                 ↓                     ↓                     ↓
    ┌────────────────────────────────────────────────────────────────┐
    │              FastAPI Backend (app.py, routers/)                │
    │                                                                │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │ Route: POST /upload                                      │ │
    │  │ • Save CSV to: uploads/user{id}_{ts}_{name}.csv         │ │
    │  │ • Set Redis: active_dataset:{user_id} = local_path      │ │
    │  │ • Return: {dataset_id, message}                         │ │
    │  └──────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │ Route: POST /analyze (MAIN)                              │ │
    │  │ • Get active_dataset from Redis (or use provided link)  │ │
    │  │ • Run pipeline in threadpool (non-blocking)             │ │
    │  │ • Return: {type: "dynamic_dashboards", dashboards: {...}} │ │
    │  └──────────────────────────────────────────────────────────┘ │
    └────────────────────────┬───────────────────────────────────────┘
                             │
                             │ run_pipeline() in threadpool
                             ↓
    ┌────────────────────────────────────────────────────────────────┐
    │        AGENTIC PIPELINE (agents/pipeline.py)                   │
    │                                                                │
    │  ┌─ STEP 1: INGEST ────────────────────────────────────────┐  │
    │  │ ingestion_agent.ingest_data_from_source()              │  │
    │  │ • Read CSV with multi-encoding support                 │  │
    │  │ • Return: DataFrame (9994 rows × 21 cols)              │  │
    │  │ Output: ✅ Ingested dataset: 9994 rows × 21 cols       │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │              │                                                 │
    │              ↓                                                 │
    │  ┌─ STEP 2: CLEAN (LLM) ───────────────────────────────────┐  │
    │  │ cleaning_agent.run_cleaning_agent()                    │  │
    │  │ • Send sample + schema to Groq LLM                     │  │
    │  │ • LLM returns: {cleaning_steps, feature_eng_steps}     │  │
    │  │ • Execute: drop columns, convert types, rename, etc.   │  │
    │  │ • Normalize all column names                           │  │
    │  │ Output: ✅ Cleaning complete → 9994 rows × 22 cols     │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │              │                                                 │
    │              ↓                                                 │
    │  ┌─ STEP 3: STORE ─────────────────────────────────────────┐  │
    │  │ storage_agent.store_dataset_in_db()                    │  │
    │  │ • Create table: ds_user_{user_id}                      │  │
    │  │ • Store cleaned DataFrame in SQLite                    │  │
    │  │ Output: ✅ Dataset stored → table='ds_user_4' (9994) │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │              │                                                 │
    │              ↓                                                 │
    │  ┌─ STEP 4: EXTRACT SCHEMA ────────────────────────────────┐  │
    │  │ schema.extract_schema()                                │  │
    │  │ • Query SQLite: PRAGMA table_info(ds_user_4)          │  │
    │  │ • Build column list with types                         │  │
    │  │ Output: Column metadata {name, type}[]                 │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │              │                                                 │
    │              ↓                                                 │
    │  ┌─ STEP 5: GENERATE SQL (LLM) ────────────────────────────┐  │
    │  │ sql_agent.generate_sql_plan()                          │  │
    │  │ • Send question + schema to Groq LLM                   │  │
    │  │ • LLM returns: {sql_query, chart_mapping, reasoning}   │  │
    │  │ • Validate SQL against schema                          │  │
    │  │ Output: SQL query + chart type info                    │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │              │                                                 │
    │              ↓                                                 │
    │  ┌─ STEP 6: EXECUTE SQL ────────────────────────────────────┐  │
    │  │ execution_agent.execute_sql_query()                    │  │
    │  │ • Execute: SELECT category, SUM(sales), SUM(profit)... │  │
    │  │ • Convert results to list[dict]                        │  │
    │  │ Output: 3 rows (Furniture, Office Supplies, Technology)│  │
    │  │          with sales and profit columns                 │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │              │                                                 │
    │              ↓                                                 │
    │  ┌─ STEP 7: GENERATE 4 DASHBOARDS (LLM) ──────────────────┐  │
    │  │ dynamic_dashboard_agent.generate_four_dashboards_complete()│
    │  │ • Send question + results to Groq LLM                  │  │
    │  │ • LLM returns: {kpi_dashboard, analytics_..., ...}     │  │
    │  │ • Each dashboard: title, insight, 4 KPIs, 4 charts     │  │
    │  │ • Enrich charts with SQL result data                   │  │
    │  │ Output: 4 fully specified dashboards with data         │  │
    │  │ ✅ 4 Dashboard specs generated:                        │  │
    │  │  📊 kpi_dashboard: Category Sales Summary (4/4 KPIs)   │  │
    │  │  📊 analytics_dashboard: Detailed Analysis (4/4 KPIs)  │  │
    │  │  📊 performance_dashboard: Performance Metrics (4/4)   │  │
    │  │  📊 insights_dashboard: Key Insights (4/4 KPIs)        │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │                                                                │
    │  Return: {                                                     │
    │    "type": "dynamic_dashboards",                              │
    │    "dashboards": {                                            │
    │      "kpi_dashboard": {...},                                  │
    │      "analytics_dashboard": {...},                            │
    │      "performance_dashboard": {...},                          │
    │      "insights_dashboard": {...}                              │
    │    },                                                         │
    │    "sql_query": "SELECT ...",                                 │
    │    "rows_returned": 3                                         │
    │  }                                                             │
    └────────────────────────┬───────────────────────────────────────┘
                             │
                             ↓ JSON Response
    ┌────────────────────────────────────────────────────────────────┐
    │                     Frontend (React)                           │
    │                                                                │
    │  runCustomAnalysis() callback receives payload
    │  • setDynamicDashboards(payload.dashboards)
    │  • setActiveMode("dashboard_view")
    │                                                                │
    │  DashboardView component:
    │  • Checks if dynamicDashboards exists
    │  • Renders 4-DASHBOARD HUB with selection cards
    │                                                                │
    │  User clicks one dashboard (e.g., "KPI Dashboard")
    │  • setSelectedDashboard("kpi")
    │  • Renders: <KPIDashboard dashboardData={...} />
    │                                                                │
    │  KPIDashboard renders:
    │  • 4 KPI Cards (metrics like "$2.3M Total Sales")
    │  • 4 Interactive Charts (Bar, Pie, Area, Line)
    │  • Play/Pause/Resume/Stop voice buttons
    │                                                                │
    │  User clicks Play
    │  • Extract text: "Category Sales and Profit Summary..."
    │  • speechSynthesis.speak(utterance)
    │  • Browser speaks using Web Speech API
    │                                                                │
    │  User sees:
    │  ┌──────────────────────────────────────────────────────┐   │
    │  │ KPI Dashboard                            ← [Back]    │   │
    │  │ Category Sales and Profit Summary                     │   │
    │  │                                                       │   │
    │  │ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │
    │  │ │ $2.3M   │  │ $360K   │  │ $770K   │  │ Tech    │  │   │
    │  │ │ Sales   │  │ Profit  │  │ Avg/Cat │  │ Profit  │  │   │
    │  │ └─────────┘  └─────────┘  └─────────┘  └─────────┘  │   │
    │  │                                                       │   │
    │  │ [Bar Chart]    [Pie Chart]   [Area Chart]   [Line]  │   │
    │  │                                                       │   │
    │  │ [🎙️  Play] [⏸️  Pause] [▶️  Resume] [⏹️  Stop]    │   │
    │  └──────────────────────────────────────────────────────┘   │
    │                                                                │
    └────────────────────────────────────────────────────────────────┘
                             │
                User sees interactive dashboard
                Charts respond to hover, legend toggle
```

---

## 2️⃣ Detailed Sequence Diagram: User Query to Dashboard

```
User (Browser)          Frontend App          FastAPI Router        Pipeline         Database
    │                        │                      │                   │                │
    │ Click "Ask AI"          │                      │                   │                │
    ├───────────────────────────────────────────────────────────────────────────────────→
    │                        │ POST /analyze        │                   │                │
    │                        │ {query, dataset}     │                   │                │
    │                        ├─────────────────────→│                   │                │
    │                        │                      │ run_pipeline()    │                │
    │                        │                      ├──────────────────→│                │
    │                        │                      │                   │ [7 STEPS]      │
    │                        │                      │                   │                │
    │                        │                      │                   ├──────────────→│
    │                        │                      │                   │ Create table  │
    │                        │                      │                   │ ds_user_4     │
    │                        │                      │                   │←──────────────┤
    │                        │                      │                   │                │
    │                        │                      │                   ├──────────────→│
    │                        │                      │                   │ INSERT cleaned│
    │                        │                      │                   │ data (9994)   │
    │                        │                      │                   │←──────────────┤
    │                        │                      │                   │                │
    │                        │                      │                   ├──────────────→│
    │                        │                      │                   │ Query results │
    │                        │                      │                   │ (3 rows)      │
    │                        │                      │                   │←──────────────┤
    │                        │                      │                   │                │
    │                        │                      │ {result}←────────┤                │
    │                        │←─────────────────────┤ [4 dashboards]   │                │
    │                        │ {dynamic_dashboards} │                   │                │
    │                        │ 4 dashboard specs    │                   │                │
    │ setDynamicDashboards() │←───────────────────  │                   │                │
    │←───────────────────────┤                      │                   │                │
    │                        │                      │                   │                │
    │ render() 4-dashboard   │                      │                   │                │
    │ hub with 4 cards       │                      │                   │                │
    │←───────────────────────┤                      │                   │                │
    │                        │                      │                   │                │
    │ User clicks card       │                      │                   │                │
    ├───────────────────────→│                      │                   │                │
    │                        │ setSelectedDashboard │                   │                │
    │                        │ Render KPIDashboard  │                   │                │
    │                        │←──────────────────   │                   │                │
    │                        │                      │                   │                │
    │ see 4 KPI cards +      │                      │                   │                │
    │ 4 interactive charts   │                      │                   │                │
    │←───────────────────────┤                      │                   │                │
    │                        │                      │                   │                │
    │ User clicks Play       │                      │                   │                │
    ├───────────────────────→│                      │                   │                │
    │                        │ Web Speech API       │                   │                │
    │                        │ speechSynthesis...   │                   │                │
    │                        ├──→ 🎙️ Voice output  │                   │                │
    │←───────────────────────┤                      │                   │                │
    │                        │                      │                   │                │
    │ hear narration         │                      │                   │                │
    │ interact with charts   │                      │                   │                │
    │                        │                      │                   │                │
```

---

## 3️⃣ Data Structure Flowchart

```
CSV Input File
"Sample - Superstore.csv"
(21 columns, 9994 rows)
        │
        ├─ Order ID          │
        ├─ Order Date        │
        ├─ Ship Date         │ Input: Raw Data
        ├─ Customer Name     │
        ├─ Category          │
        ├─ Sales             │ (needs cleaning)
        ├─ Profit            │
        └─ ... (14 more)     │
        │
        ↓ [STEP 2: CLEAN + ENGINEER]
        │
Cleaned DataFrame
(22 columns, 9994 rows)
        │
        ├─ order_id          │
        ├─ order_date        │
        ├─ order_year (NEW)  │ Engineered
        ├─ order_month (NEW) │ Features
        ├─ customer_name     │
        ├─ category          │
        ├─ sales (float)     │ Standardized
        ├─ profit (float)    │ Types
        └─ ... (14 more)     │
        │
        ↓ [STEP 3: STORE]
        │
SQLite Database
Table: ds_user_4
        │
        ├─ Column 1: order_id (TEXT)
        ├─ Column 2: order_date (TIMESTAMP)
        ├─ ...
        ├─ Column 22: order_month (INTEGER)
        │
        └─ Row 1: [order_1, 2018-01-11, ...]
           Row 2: [order_2, 2018-01-11, ...]
           ...
           Row 9994: [order_9994, 2020-12-30, ...]
        │
        ↓ [STEP 5-6: SQL QUERY]
        │
SQL Query Results
(3 rows, 3 columns)
        │
        ├─ Row 1: [Office Supplies, 719047.03, 122490.80]
        ├─ Row 2: [Furniture, 741999.80, 18451.27]
        └─ Row 3: [Technology, 836154.03, 145454.95]
        │
        │ with columns: [category, total_sales, total_profit]
        │
        ↓ [STEP 7: LLM GENERATES 4 DASHBOARDS]
        │
4 Dashboard Specifications
        │
        ├─ kpi_dashboard
        │   ├─ title: "Category Sales and Profit Summary"
        │   ├─ insight: "Office Supplies highest profit..."
        │   ├─ kpis: [4 KPI objects with labels, values, units]
        │   └─ charts: [
        │       {
        │         title: "Total Sales by Category",
        │         type: "bar",
        │         data: [{category: "Office Supplies", total_sales: 719047.03}, ...]
        │       },
        │       ... (3 more charts)
        │     ]
        │
        ├─ analytics_dashboard { similar structure }
        ├─ performance_dashboard { similar structure }
        └─ insights_dashboard { similar structure }
        │
        ↓ [JSON RESPONSE to Frontend]
        │
Frontend State
        │
        ├─ dynamicDashboards: {
        │    kpi_dashboard: {...},
        │    analytics_dashboard: {...},
        │    performance_dashboard: {...},
        │    insights_dashboard: {...}
        │  }
        ├─ selectedDashboard: null (shows hub)
        │           ↓ (user clicks dashboard card)
        ├─ selectedDashboard: "kpi" (shows KPI dashboard)
        │           ↓
        └─ Render KPIDashboard with 4 KPI cards + 4 Recharts visualizations
```

---

## 4️⃣ Component Hierarchy (Frontend)

```
App.jsx (Main Router)
    │
    ├─ ProtectedRoute.jsx
    │   │
    │   ├─ Home.jsx (Main Analysis Page)
    │   │   │
    │   │   ├─ State:
    │   │   │   ├─ activeDataset (url)
    │   │   │   ├─ queryInput (string)
    │   │   │   ├─ dynamicDashboards (object) ← [NEW in 4-dashboard system]
    │   │   │   ├─ selectedDashboard (null | "kpi" | "analytics" | ...)
    │   │   │   └─ isLoading (boolean)
    │   │   │
    │   │   ├─ Components:
    │   │   │   ├─ Navbar
    │   │   │   ├─ Sidebar (dataset upload + status)
    │   │   │   ├─ QueryBox (text input + submit)
    │   │   │   └─ DashboardView ← Conditional rendering
    │   │   │
    │   │   └─ Functions:
    │   │       ├─ uploadDataset() → POST /upload
    │   │       └─ runCustomAnalysis() → POST /analyze
    │   │           ├─ if (payload.type === "dynamic_dashboards")
    │   │           │   └─ setDynamicDashboards(payload.dashboards)
    │   │           └─ setActiveMode("dashboard_view")
    │   │
    │   └─ DashboardView.jsx (Renders 4-Dashboard Hub + Selection)
    │       │
    │       ├─ Props:
    │       │   ├─ dynamicDashboards (the 4 dashboard objects)
    │       │   └─ selectedDashboard (null or dashboard type)
    │       │
    │       └─ Conditional Rendering:
    │           │
    │           ├─ if (!dynamicDashboards) → show empty state
    │           │
    │           ├─ else if (selectedDashboard === null)
    │           │   │ Render 4-DASHBOARD HUB
    │           │   │
    │           │   └─ 4 Cards in 2×2 grid:
    │           │       ├─ [Card 1] KPI Dashboard
    │           │       │   onClick → setSelectedDashboard("kpi")
    │           │       ├─ [Card 2] Analytics Dashboard
    │           │       │   onClick → setSelectedDashboard("analytics")
    │           │       ├─ [Card 3] Performance Dashboard
    │           │       │   onClick → setSelectedDashboard("performance")
    │           │       └─ [Card 4] Insights Dashboard
    │           │           onClick → setSelectedDashboard("insights")
    │           │
    │           └─ else if (selectedDashboard === "kpi")
    │               │
    │               └─ Render <KPIDashboard />
    │                   │
    │                   ├─ Props:
    │                   │   └─ dashboardData={dynamicDashboards.kpi_dashboard}
    │                   │
    │                   ├─ State:
    │                   │   ├─ isPlaying (voice)
    │                   │   ├─ isSpeaking
    │                   │   └─ utteranceRef
    │                   │
    │                   ├─ Components:
    │                   │   ├─ Back Button (onClick → setSelectedDashboard(null))
    │                   │   ├─ [4× KPICard component]
    │                   │   │   ├─ Displays label, value, unit, change %
    │                   │   │   └─ Data from dashboardData.kpis[i]
    │                   │   ├─ [4× Chart components (Recharts)]
    │                   │   │   ├─ Bar Chart (dashboardData.charts[0].data)
    │                   │   │   ├─ Pie Chart (dashboardData.charts[1].data)
    │                   │   │   ├─ Area Chart (dashboardData.charts[2].data)
    │                   │   │   └─ Line Chart (dashboardData.charts[3].data)
    │                   │   └─ Voice Controls
    │                   │       ├─ [🎙️  Play] - Start narration
    │                   │       ├─ [⏸️  Pause] - Pause speech
    │                   │       ├─ [▶️  Resume] - Resume speech
    │                   │       └─ [⏹️  Stop] - Stop & reset
    │                   │
    │                   └─ Functions:
    │                       ├─ handleVoiceSummary()
    │                       │   └─ const utterance = new SpeechSynthesisUtterance(...)
    │                       │      speechSynthesis.speak(utterance)
    │                       └─ (plus analytics, performance, insights duplicates)
    │
    ├─ LoginPage.jsx
    └─ SignupPage.jsx
```

---

## 5️⃣ Error Handling & Resilience Flow

```
POST /analyze Request
        │
        ├─ Validate JWT token
        │   ├─ ✅ Valid → Continue
        │   └─ ❌ Invalid → 401 Unauthorized
        │
        ├─ Validate dataset exists (Redis)
        │   ├─ ✅ Found → Continue
        │   └─ ❌ Not found → 400 NO_DATASET
        │
        ├─ run_pipeline() in threadpool
        │   │
        │   ├─ [STEP 1] Ingest CSV
        │   │   ├─ Try encoding: utf-8
        │   │   │   ├─ ✅ Success → Use this
        │   │   │   └─ ❌ Fail → Try latin-1
        │   │   ├─ Try encoding: latin-1
        │   │   │   ├─ ✅ Success → Use this
        │   │   │   └─ ❌ Fail → Try iso-8859-1
        │   │   ├─ Try encoding: iso-8859-1
        │   │   │   ├─ ✅ Success → Use this
        │   │   │   └─ ❌ Fail → Try cp1252
        │   │   └─ Try encoding: cp1252
        │   │       ├─ ✅ Success → Use this
        │   │       └─ ❌ Fail → Raise ValueError("Cannot decode CSV")
        │   │
        │   ├─ [STEP 2] Clean (LLM)
        │   │   ├─ Try Groq API call (attempt 1/2)
        │   │   │   ├─ ✅ Success → Continue
        │   │   │   └─ ❌ Timeout/Error:
        │   │   │       ├─ Print traceback
        │   │   │       ├─ Wait 1 second
        │   │   │       └─ Try Groq API call (attempt 2/2)
        │   │   ├─ Try Groq API call (attempt 2/2)
        │   │   │   ├─ ✅ Success → Continue
        │   │   │   └─ ❌ Fail → Raise ValueError("LLM_CALL_FAILED")
        │   │   │
        │   │   ├─ Parse LLM JSON
        │   │   │   ├─ ✅ Valid JSON → Continue
        │   │   │   └─ ❌ Invalid → Use empty plan {}
        │   │   │
        │   │   └─ Execute cleaning steps
        │   │       ├─ For each step:
        │   │       │   ├─ Try execution
        │   │       │   │   ├─ ✅ Success → Continue
        │   │       │   │   └─ ❌ Fail → Print warning, skip this step
        │   │       │   └─ Continue to next step
        │   │
        │   ├─ [STEP 3-6] ... (similar retry/fallback patterns)
        │   │
        │   ├─ [STEP 7] Generate 4 Dashboards (LLM)
        │   │   ├─ Try Groq API call (attempt 1/2)
        │   │   │   ├─ ✅ Success → Parse JSON
        │   │   │   └─ ❌ Timeout/Error:
        │   │   │       ├─ Print traceback
        │   │   │       ├─ Wait 1 second
        │   │   │       └─ Try Groq API call (attempt 2/2)
        │   │   │
        │   │   ├─ If JSON parse fails → Use minimal 4-dashboard template
        │   │   │   with generic titles and empty charts
        │   │   │
        │   │   └─ Enrich charts with SQL data
        │   │       └─ Attach data to each chart spec
        │   │
        │   └─ Return result: {type: "dynamic_dashboards", dashboards: {...}}
        │
        ├─ Return result to router
        │   ├─ ✅ Success → Return 200 with result
        │   └─ ❌ ValueError → Return 422 PIPELINE_ERROR
        │   └─ ❌ Any other error → Return 500 INTERNAL_ERROR (+ traceback printed)
        │
        └─ Frontend receives response
            ├─ ✅ type === "dynamic_dashboards"
            │   └─ setDynamicDashboards(result.dashboards)
            │       Render 4-dashboard hub
            │
            ├─ ✅ type === "simple_chart"
            │   └─ setCustomResult(result)
            │       Render fallback single chart (if dashboard generation failed)
            │
            └─ ❌ Error response
                └─ Show error toast: "Failed to process query: {message}"
```

---

## 6️⃣ Authentication & Session Flow

```
User (First Visit)
        │
        ├─ No JWT token in localStorage
        │
        └─ Redirect to /login → LoginPage.jsx
            │
            ├─ User enters email + password
            │
            ├─ POST /auth/login
            │   {email, password}
            │       │
            │       ├─ Backend validates credentials
            │       │   ├─ ✅ Valid → Generate JWT
            │       │   └─ ❌ Invalid → Return 401
            │       │
            │       └─ Return: {token, user_id}
            │
            ├─ Frontend stores token:
            │   localStorage.setItem("token", token)
            │
            ├─ Redirect to /home
            │
            └─ ProtectedRoute checks localStorage
                ├─ ✅ Token exists
                │   └─ Render Home.jsx
                └─ ❌ No token
                    └─ Redirect to /login

User (Authenticated)
        │
        ├─ Every API call includes:
        │   headers: {Authorization: "Bearer {token}"}
        │
        ├─ Backend FastAPI dependency:
        │   def get_current_user_id(token) → validates JWT
        │       ├─ ✅ Valid → Extract user_id from claims
        │       └─ ❌ Invalid/Expired → Return 401
        │
        ├─ User_id used throughout:
        │   ├─ File naming: uploads/user{id}_{ts}_{name}
        │   ├─ Table naming: ds_user_{id}
        │   └─ Redis key: active_dataset:{user_id}
        │
        └─ Session expires after 1 hour (SESSION_TTL)
            └─ User must log in again

Redis Session Cache
        │
        ├─ Key format: active_dataset:{user_id}
        │   └─ Value: "local://uploads/user4_1775401276_Sample - Superstore.csv"
        │
        ├─ TTL: 1 hour (SESSION_TTL)
        │   └─ After 1 hour: Cache entry expires
        │
        ├─ On next /analyze call:
        │   ├─ Check Redis for active_dataset:{user_id}
        │   │   ├─ ✅ Found → Use cached dataset
        │   │   └─ ❌ Not found → Check request body
        │   ├─ If request has dataset_link:
        │   │   └─ Update Redis: active_dataset:{user_id} = new_link (ex: 1 hour)
        │   └─ If request has no dataset_link AND cache miss:
        │       └─ Return 400 NO_DATASET error
        │
        └─ File cleanup: Uploads older than 1 hour deleted
```

---

## 7️⃣ Voice Narration Flow

```
User clicks [🎙️  Play] on dashboard
        │
        ├─ Extract text from dashboard insight
        │   └─ E.g., "Category Sales and Profit Summary. 
        │      Office Supplies has the highest profit at $122K despite mid-range sales."
        │
        ├─ Create SpeechSynthesisUtterance
        │   const utterance = new SpeechSynthesisUtterance(text)
        │   utterance.rate = 1.0  (normal speed)
        │   utterance.pitch = 1.0
        │   utterance.volume = 1.0
        │
        ├─ Add event listeners
        │   utterance.onstart = () => setIsPlaying(true)
        │   utterance.onend = () => setIsPlaying(false)
        │   utterance.onerror = (e) => console.error(e)
        │
        ├─ Start speaking
        │   speechSynthesis.speak(utterance)
        │   setState: isPlaying = true
        │
        ├─ Browser renders buttons differently
        │   ├─ Play button → hidden (already playing)
        │   ├─ Pause button → visible (can pause)
        │   ├─ Resume button → hidden (not paused yet)
        │   └─ Stop button → visible (can stop)
        │
        ├─ User clicks [⏸️  Pause]
        │   │
        │   ├─ speechSynthesis.pause()
        │   ├─ setState: isPaused = true
        │   │
        │   └─ UI updates:
        │       ├─ Pause button → hidden
        │       ├─ Resume button → visible
        │       └─ Stop button → visible
        │
        ├─ User clicks [▶️  Resume]
        │   │
        │   ├─ speechSynthesis.resume()
        │   ├─ setState: isPaused = false
        │   │
        │   └─ UI updates:
        │       ├─ Pause button → visible (again)
        │       └─ Resume button → hidden
        │
        ├─ OR User clicks [⏹️  Stop]
        │   │
        │   ├─ speechSynthesis.cancel()
        │   ├─ setState: isPlaying = false, isPaused = false
        │   │
        │   └─ UI updates:
        │       ├─ All buttons reset to initial state
        │       ├─ Play button → visible
        │       ├─ Pause button → hidden
        │       ├─ Resume button → hidden
        │       └─ Stop button → hidden
        │
        └─ Speech finishes naturally OR user stops
            └─ setState: isPlaying = false
```

---

## 8️⃣ Summary: Complete Data Journey

```
┌─ START: User uploads CSV
│  └─ 9994 rows × 21 columns (raw data)
│
├─ [STEP 1] Ingest
│  └─ Load with multi-encoding support
│
├─ [STEP 2] Clean (LLM-Driven)
│  └─ 9994 rows × 22 columns (engineered features)
│
├─ [STEP 3] Store
│  └─ SQLite table: ds_user_4 (9994 rows)
│
├─ [STEP 4] Schema
│  └─ Extract column metadata
│
├─ [STEP 5] SQL Generation (LLM)
│  └─ "Which category is profitable but has low sales?"
│     → SELECT category, SUM(sales), SUM(profit) GROUP BY category
│
├─ [STEP 6] Execute SQL
│  └─ 3 result rows: {category, total_sales, total_profit}
│
├─ [STEP 7] Generate 4 Dashboards (LLM)
│  │
│  ├─ kpi_dashboard
│  │  └─ 4 KPI cards + 4 charts with real SQL data
│  │
│  ├─ analytics_dashboard
│  │  └─ 4 KPI cards + 4 charts with real SQL data
│  │
│  ├─ performance_dashboard
│  │  └─ 4 KPI cards + 4 charts with real SQL data
│  │
│  └─ insights_dashboard
│     └─ 4 KPI cards + 4 charts with real SQL data
│
├─ Frontend receives 4 dashboards
│  └─ Show 4-dashboard hub with selection cards
│
├─ User clicks one dashboard
│  └─ Show dashboard with 4 KPI cards + 4 interactive charts
│
├─ User clicks Play
│  └─ Voice narration reads dashboard insight (Web Speech API)
│
└─ END: User explores interactive visualizations
```

---
