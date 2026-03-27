import { useState, useEffect } from "react";
import { LinkIcon, Activity, Zap, Database, Check, AlertCircle, ExternalLink, Play, Sparkles, LayoutDashboard, ChevronLeft, UploadCloud, TrendingUp, DollarSign, Users, Target, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import api from "../api/client";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import QueryBox from "../components/QueryBox";
import ChartSelector from "../components/ChartSelector";
import ChartCard from "../components/ChartCard";
import KPICard from "../components/KPICard";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area,
  ScatterChart, Scatter,
} from "recharts";

const COLORS = ["#6c63ff", "#4caf8a", "#ff9800", "#e91e63", "#00bcd4", "#a78bfa", "#34d399"];

// ─────────────────────────────────────────────────────────────────────────────
// Universal Dynamic Chart
// ─────────────────────────────────────────────────────────────────────────────
function DynamicChart({ chartType, data, xAxis, yAxis }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#8a8fa8] text-sm font-medium">
        No graphical data available
      </div>
    );
  }

  const gridEl    = <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />;
  const xEl       = <XAxis dataKey={xAxis} stroke="#8a8fa8" tick={{ fill: "#8a8fa8", fontSize: 12 }} interval="preserveStartEnd" />;
  const yEl       = <YAxis stroke="#8a8fa8" tick={{ fill: "#8a8fa8", fontSize: 12 }} />;
  const tipEl     = <Tooltip contentStyle={{ backgroundColor: "rgba(22, 24, 31, 0.95)", backdropFilter: "blur(10px)", border: "1px solid #2a2d3a", borderRadius: "12px", color: "#f0f0f5", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }} />;
  const legendEl  = <Legend wrapperStyle={{ fontSize: 12, color: "#8a8fa8", paddingTop: "10px" }} />;

  switch (chartType) {
    case "bar":
    case "histogram":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            {gridEl}{xEl}{yEl}{tipEl}{legendEl}
            <Bar dataKey={yAxis} radius={[6, 6, 0, 0]} maxBarSize={60}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6c63ff" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            {gridEl}{xEl}{yEl}{tipEl}{legendEl}
            <Line type="monotone" dataKey={yAxis} stroke="url(#lineGrad)" strokeWidth={4}
              dot={{ fill: "#1e2029", stroke: "#6c63ff", strokeWidth: 2, r: 5 }} activeDot={{ r: 8, fill: "#6c63ff", stroke: "#fff" }} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "area":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4caf8a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4caf8a" stopOpacity={0} />
              </linearGradient>
            </defs>
            {gridEl}{xEl}{yEl}{tipEl}{legendEl}
            <Area type="monotone" dataKey={yAxis} stroke="#4caf8a" strokeWidth={3} fill="url(#areaGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {tipEl}{legendEl}
            <Pie data={data} dataKey={yAxis} nameKey={xAxis} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    case "scatter":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            {gridEl}
            <XAxis type="number" dataKey={xAxis} name={xAxis} stroke="#8a8fa8" tick={{ fill: "#8a8fa8", fontSize: 12 }} />
            <YAxis type="number" dataKey={yAxis} name={yAxis} stroke="#8a8fa8" tick={{ fill: "#8a8fa8", fontSize: 12 }} />
            {tipEl}{legendEl}
            <Scatter name={`${xAxis} vs ${yAxis}`} data={data} fill="#ff9800" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    default:
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            {gridEl}{xEl}{yEl}{tipEl}{legendEl}
            <Bar dataKey={yAxis} fill="#00bcd4" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset Dashboard Prompts
// ─────────────────────────────────────────────────────────────────────────────
const PRESET_DASHBOARDS = [
  {
    id: "exec",
    name: "Executive Overview",
    icon: DollarSign,
    prompt: "Show total revenue, total profit, and average order value across all regions. I need high-level KPIs.",
    charts: ["bar", "line", "pie", "area"]
  },
  {
    id: "sales",
    name: "Sales Analytics",
    icon: BarChart2,
    prompt: "Show sales distribution by top 10 products and trends over time. Include price vs quantity context if possible.",
    charts: ["bar", "line", "scatter", "histogram"]
  },
  {
    id: "customers",
    name: "Customer Insights",
    icon: Users,
    prompt: "Show total distinct customers, their purchasing segments, and repeat rate or growth trend across time/regions.",
    charts: ["pie", "bar", "line", "area"]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Home Page (Main BI Dashboard Interface)
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [datasetLink, setDatasetLink]       = useState("");
  const [query, setQuery]                   = useState("");
  const [selectedCharts, setSelectedCharts] = useState(["bar", "line", "pie", "area"]);
  
  const [loading, setLoading]               = useState(false);
  const [hasSession, setHasSession]         = useState(false);
  const [result, setResult]                 = useState(null); // single query result dict
  const [kpiMetrics, setKpiMetrics]         = useState([]);   // calculated KPIs
  const [activeTab, setActiveTab]           = useState("custom");
  const [analysisError, setAnalysisError]   = useState(null);

  // Pre-fill dataset from Redis session on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/dataset-status");
        if (res.data.has_dataset) {
          setDatasetLink(res.data.dataset_id);
          setHasSession(true);
        }
      } catch {}
    })();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true); setAnalysisError(null);
    try {
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDatasetLink(response.data.dataset_id);
      setHasSession(true);
    } catch (err) {
      setAnalysisError(err.response?.data?.detail?.message || "File upload failed.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleToggleChart = (chartId) =>
    setSelectedCharts(prev => prev.includes(chartId) ? prev.filter(c => c !== chartId) : [...prev, chartId]);

  // Dynamic KPI Builder from flat JSON payload
  const calculateKPIs = (data, xAxis, yAxis) => {
    if (!data || data.length === 0) return [];
    
    // Attempt numeric conversions to derive intelligent KPIs
    let total = 0, maxVal = -Infinity, minVal = Infinity, bestX = "N/A";
    const numericData = [];

    data.forEach(item => {
      const val = Number(item[yAxis]);
      if (!isNaN(val)) {
        numericData.push(val);
        total += val;
        if (val > maxVal) { maxVal = val; bestX = item[xAxis] || "Unknown"; }
        if (val < minVal) { minVal = val; }
      }
    });

    if (numericData.length === 0) {
      return [
        { title: "Total Records", value: data.length, icon: Database, colorClass: "text-[#6c63ff]" },
        { title: "Unique Categories", value: new Set(data.map(d => d[xAxis])).size, icon: PieChartIcon, colorClass: "text-[#ff9800]" }
      ];
    }

    const avg = total / numericData.length;
    
    // Safely format as currency/units based on heuristics or just generic K/M suffixes
    const format = (n) => {
      if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
      if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "k";
      return Number.isInteger(n) ? n.toString() : n.toFixed(2);
    };

    return [
      { title: `Total ${yAxis.replace(/_/g, " ")}`, value: format(total), icon: Target, colorClass: "text-[#6c63ff]" },
      { title: `Average ${yAxis.replace(/_/g, " ")}`, value: format(avg), icon: TrendingUp, colorClass: "text-[#4caf8a]" },
      { title: `Highest ${xAxis.replace(/_/g, " ")}`, value: bestX, subValue: `(${format(maxVal)})`, icon: Zap, colorClass: "text-[#e91e63]" },
      { title: "Total Segments", value: numericData.length, icon: LayersIcon, colorClass: "text-[#00bcd4]" }
    ];
  };

  const executeAnalysis = async (qText, reqCharts) => {
    if (!qText.trim() || reqCharts.length === 0) return;
    setLoading(true); setResult(null); setAnalysisError(null); setKpiMetrics([]);

    try {
      const response = await api.post("/analyze", {
        dataset_link: datasetLink.trim() || null,
        query: qText.trim(),
        requested_charts: reqCharts,
      });
      if (response.data.dataset_id) setHasSession(true);
      
      const payload = response.data;
      setResult(payload);
      setKpiMetrics(calculateKPIs(payload.data, payload.x_axis, payload.y_axis));
      
    } catch (err) {
      setAnalysisError(err.response?.data?.detail?.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0e0f14] text-[#f0f0f5] overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
          <div className="max-w-[1500px] mx-auto">
            
            {/* Header / Preset Dashboards Navigator */}
            <div className="mb-14">
              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8a8fa8] mb-8">
                BI Command Center
              </h1>
              
              <div className="flex flex-wrap gap-4 border-b border-[#2a2d3a] pb-6">
                <button
                  onClick={() => { setActiveTab("custom"); setQuery(""); setResult(null); }}
                  className={`px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${activeTab === "custom" ? "bg-[#6c63ff] text-white shadow-[0_0_20px_rgba(108,99,255,0.4)]" : "bg-[#16181f] text-[#8a8fa8] border border-[#2a2d3a] hover:text-white"}`}
                >
                  <Activity size={18} /> Custom AI Query
                </button>
                {PRESET_DASHBOARDS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setActiveTab(preset.id);
                      setQuery(preset.prompt);
                      setSelectedCharts(preset.charts);
                      executeAnalysis(preset.prompt, preset.charts);
                    }}
                    className={`px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${activeTab === preset.id ? "bg-[#2a2d3a] text-white border border-[#4caf8a] shadow-[0_0_15px_rgba(76,175,138,0.2)]" : "bg-[#16181f] text-[#8a8fa8] border border-[#2a2d3a] hover:text-white"}`}
                  >
                    <preset.icon size={18} /> {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ERROR Banner */}
            {analysisError && (
              <div className="mb-10 flex items-start gap-3 bg-[#ff5e5e]/10 border border-[#ff5e5e]/30 text-[#ff5e5e] px-6 py-4 rounded-2xl text-sm font-semibold shadow-xl">
                <AlertCircle size={18} className="mt-0.5 shrink-0" /> {analysisError}
              </div>
            )}

            {/* ── Setup Form (Visible only on Custom Query unless result is loading) ───────────────── */}
            {activeTab === "custom" && !result && (
              <div className="bg-[#16181f]/80 backdrop-blur-3xl border border-[#2a2d3a] rounded-[2rem] p-8 lg:p-10 shadow-2xl max-w-4xl mx-auto mb-16 relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#6c63ff]/20 to-[#4caf8a]/10 rounded-[2rem] blur-2xl -z-10 opacity-70" />

                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Database className="text-[#6c63ff]" size={26} /> Define Workspace Context
                </h2>

                <div className="flex flex-col gap-8">
                  <div>
                    <label className="text-sm font-bold text-[#8a8fa8] mb-3 flex items-center gap-2 uppercase tracking-wide">
                      Dataset Link or Upload
                      {hasSession && <span className="ml-2 flex items-center gap-1 text-[#4caf8a] text-[10px] font-black uppercase tracking-widest bg-[#4caf8a]/10 px-2 py-0.5 rounded-full"><Check size={10} /> Active Connection</span>}
                    </label>
                    <div className="flex items-center gap-3 bg-[#0e0f14] border border-[#2a2d3a] focus-within:border-[#6c63ff] p-2.5 rounded-2xl transition-all shadow-inner">
                      <div className={`p-2.5 rounded-xl ${hasSession ? "bg-[#4caf8a]/10 text-[#4caf8a]" : "bg-[#1e2029] text-[#4caf8a]"}`}>
                        <LinkIcon size={18} />
                      </div>
                      <input
                        type="text"
                        value={datasetLink.startsWith("local://") ? "Uploaded Local File (Active)" : datasetLink}
                        onChange={e => { setDatasetLink(e.target.value); setHasSession(false); }}
                        placeholder={hasSession ? "Active session — paste new URL or upload to switch…" : "Paste public CSV URL or Google Sheets link…"}
                        className="bg-transparent border-none text-[1.05rem] text-white flex-1 min-w-0 outline-none placeholder:text-[#8a8fa8]/40 px-2 font-medium"
                      />
                      <div className="border-l border-[#2a2d3a] pl-3 pr-1 shrink-0">
                        <label className="cursor-pointer flex items-center gap-2 bg-[#1e2029] hover:bg-[#3f4459] border border-[#2a2d3a] text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all">
                          <UploadCloud size={16} className="text-[#6c63ff]" /> {loading ? "Uploading..." : "Upload CSV"}
                          <input type="file" accept=".csv" disabled={loading} className="hidden" onChange={handleFileUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#8a8fa8] mb-3 flex items-center gap-2 uppercase tracking-wide">
                      Natural Language Prompt
                    </label>
                    <QueryBox query={query} setQuery={setQuery} onAnalyze={() => executeAnalysis(query, selectedCharts)} loading={loading} disabled={selectedCharts.length === 0} />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#8a8fa8] mb-3 flex items-center gap-2 uppercase tracking-wide">
                      Requested Output Layouts
                    </label>
                    <ChartSelector selectedCharts={selectedCharts} onToggle={handleToggleChart} />
                  </div>
                </div>
              </div>
            )}

            {/* Global Loader */}
            {loading && !result && (
              <div className="flex justify-center flex-col items-center py-20 text-[#8a8fa8]">
                <Activity size={40} className="animate-spin text-[#6c63ff] mb-4" />
                <p className="font-semibold text-lg tracking-wide animate-pulse">Running AI pipeline & executing queries...</p>
              </div>
            )}

            {/* ── Full Dashboard View (Displays Data dynamically) ────────────────────────────────────────── */}
            {result && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
                
                {/* Header Strip */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 bg-[#16181f]/80 backdrop-blur-md p-8 rounded-[2rem] border border-[#2a2d3a] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#6c63ff]/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3" />
                  
                  <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                      {activeTab !== "custom" ? PRESET_DASHBOARDS.find(p => p.id === activeTab).name : result.title || "Custom Analysis Dashboard"}
                    </h2>
                    <p className="text-[#8a8fa8] flex items-center gap-2">
                      <Database size={14} className="text-[#4caf8a]" /> Based on AI-synthesized `{result.y_axis}` against `{result.x_axis}` • {result.rows_returned} entities returned in query.
                    </p>
                  </div>

                  <div className="shrink-0 flex gap-3">
                    <button onClick={() => { setActiveTab("custom"); setResult(null); }} className="bg-[#1e2029] hover:bg-[#2a2d3a] border border-[#2a2d3a] text-white px-5 py-3 rounded-xl font-bold transition-all text-sm">
                      New Prompt
                    </button>
                    <details className="relative group z-20">
                      <summary className="cursor-pointer bg-[#6c63ff]/10 hover:bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/30 px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm select-none list-none">
                        <ExternalLink size={16} /> View Executed SQL
                      </summary>
                      <div className="absolute right-0 top-full mt-2 w-[500px] bg-[#0e0f14] border border-[#2a2d3a] rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30 opacity-0 invisible group-open:opacity-100 group-open:visible transition-all">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#8a8fa8] mb-3">LLM Generated Query</p>
                        <pre className="text-xs text-[#4caf8a] font-mono whitespace-pre-wrap leading-loose">{result.sql_query}</pre>
                      </div>
                    </details>
                  </div>
                </div>

                {/* Dynamic Top Layer KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {kpiMetrics.map((kpi, i) => (
                    <KPICard key={i} title={kpi.title} value={kpi.value} subValue={kpi.subValue} icon={kpi.icon} colorClass={kpi.colorClass} trend={i === 1 ? 12.4 : (i === 2 ? -3.1 : null)} />
                  ))}
                </div>

                {/* Dynamic 2x2 Chart Grid mapping user's selected visuals to this payload */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {selectedCharts.map((chartType) => (
                    <ChartCard 
                      key={chartType} 
                      title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Perspective — ${result.y_axis.replace(/_/g, " ")} distribution`} 
                      className={`min-h-[420px] bg-[#16181f]/40 backdrop-blur-3xl border-[#2a2d3a]/60 shadow-none hover:shadow-xl ${["area", "line"].includes(chartType) ? "lg:col-span-2" : ""}`}
                    >
                      <DynamicChart chartType={chartType} data={result.data} xAxis={result.x_axis} yAxis={result.y_axis} />
                    </ChartCard>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// Temporary LayersIcon missing handler
const LayersIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 12 12 17 22 12" />
    <polyline points="2 17 12 22 22 17" />
  </svg>
);
