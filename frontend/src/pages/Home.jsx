import { useState, useEffect } from "react";
import { LinkIcon, Activity, Zap, Database, Check, AlertCircle, ExternalLink, Play, Sparkles, LayoutDashboard, ChevronLeft, UploadCloud, TrendingUp, DollarSign, Users, Target, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import api from "../api/client";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import QueryBox from "../components/QueryBox";
import ChartSelector from "../components/ChartSelector";
import ChartCard from "../components/ChartCard";
import KPICard from "../components/KPICard";
import DashboardView from "../components/DashboardView";

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
    return <div className="flex items-center justify-center h-full text-[#8a8fa8] text-sm font-medium">No graphical data available</div>;
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

// Fixed Icon
const LayersIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 12 12 17 22 12" />
    <polyline points="2 17 12 22 22 17" />
  </svg>
);


// ─────────────────────────────────────────────────────────────────────────────
// Home Page (Main BI Dashboard Interface)
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [datasetLink, setDatasetLink]       = useState("");
  const [query, setQuery]                   = useState("");
  const [selectedCharts, setSelectedCharts] = useState(["bar", "line", "pie", "area"]);
  
  const [loading, setLoading]               = useState(false);
  const [hasSession, setHasSession]         = useState(false);
  const [analysisError, setAnalysisError]   = useState(null);

  // States for Single Custom Query Result
  const [customResult, setCustomResult] = useState(null);
  const [customKPIs, setCustomKPIs] = useState([]);

  // States for Auto Dashboards
  const [autoResult, setAutoResult] = useState(null);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [autoKPIs, setAutoKPIs] = useState([]);

  // Voice AI State
  const [isPlaying, setIsPlaying] = useState(false);

  // Top tabs
  const [activeMode, setActiveMode] = useState("setup"); // setup | custom_view | auto_gallery | auto_detail | dashboard_view

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

  const calculateKPIs = (dataList, xAxis, yAxis) => {
    if (!dataList || dataList.length === 0) return [];
    let total = 0, maxVal = -Infinity, minVal = Infinity, bestX = "N/A";
    const numericData = [];

    dataList.forEach(item => {
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
        { title: "Total Records", value: dataList.length, icon: Database, colorClass: "text-[#6c63ff]" },
        { title: "Unique Categories", value: new Set(dataList.map(d => d[xAxis])).size, icon: PieChartIcon, colorClass: "text-[#ff9800]" }
      ];
    }

    const avg = total / numericData.length;
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

  // 1: Fire Custom Pipeline
  const runCustomAnalysis = async () => {
    if (!query.trim() || selectedCharts.length === 0) return;
    setLoading(true); setAnalysisError(null);
    
    // Clear previous results before fetching new ones
    setCustomResult(null);
    setCustomKPIs([]);
    
    try {
      const response = await api.post("/analyze", {
        dataset_link: datasetLink.trim() || null,
        query: query.trim(),
        requested_charts: selectedCharts,
      });
      if (response.data.dataset_id) setHasSession(true);
      
      const payload = response.data;
      setCustomResult(payload);
      setCustomKPIs(calculateKPIs(payload.data, payload.x_axis, payload.y_axis));
      // Go directly to beautiful dashboards view instead of custom charts view
      setActiveMode("dashboard_view");
    } catch (err) {
      setAnalysisError(err.response?.data?.detail?.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  // 2: Fire Auto Dashboard Pipeline (Generates 3 dashboards)
  const runAutoDashboard = async () => {
    setLoading(true); setAnalysisError(null);
    try {
      const response = await api.post("/auto-dashboard", {
        dataset_id: datasetLink.trim() || null
      });
      setAutoResult(response.data);
      setActiveMode("auto_gallery");
    } catch (err) {
      setAnalysisError(err.response?.data?.detail?.message || "Autonomous generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to detailed dashboard
  const openDashboardDetail = (dash) => {
    setActiveDashboard(dash);
    
    // Attempt to calculate elegant KPIs using the primary chart's data
    if (dash.charts && dash.charts.length > 0) {
      const primaryChart = dash.charts[0];
      setAutoKPIs(calculateKPIs(primaryChart.data, primaryChart.x_axis, primaryChart.y_axis));
    }
    setActiveMode("auto_detail");
  };

  // Open Premium Dashboards
  const openPremiumDashboards = () => {
    setActiveMode("dashboard_view");
  };

  // Exit Premium Dashboards
  const exitDashboards = () => {
    setActiveMode("setup");
  };

  // AI Voice Controls
  const toggleVoiceScript = (script) => {
    if (!("speechSynthesis" in window)) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // kill existing
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop voice strictly when leaving
  const exitDashboardDetail = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
    setActiveDashboard(null);
    setActiveMode("auto_gallery");
  };

  return (
    <div className="flex h-screen bg-[#0e0f14] text-[#f0f0f5] overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
          <div className="max-w-[1500px] mx-auto">
            
            <div className="mb-12 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8a8fa8]">
                  Intelligence Hub
                </h1>
                <p className="text-lg text-[#8a8fa8] mt-2 font-medium flex items-center gap-2">
                  <Activity size={18} className="text-[#6c63ff]" />
                  Agentic BI — Seamlessly explore or auto-generate complete SaaS dashboards.
                </p>
              </div>
              {activeMode !== "setup" && (
                <button 
                  onClick={() => {
                    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                    setIsPlaying(false);
                    setActiveMode("setup");
                  }} 
                  className="bg-[#1e2029] hover:bg-[#2a2d3a] border border-[#2a2d3a] text-white px-5 py-3 rounded-xl font-bold transition-all text-sm"
                >
                  Configure New
                </button>
              )}
            </div>

            {/* ERROR Banner */}
            {analysisError && (
              <div className="mb-10 flex items-start gap-3 bg-[#ff5e5e]/10 border border-[#ff5e5e]/30 text-[#ff5e5e] px-6 py-4 rounded-2xl text-sm font-semibold shadow-xl">
                <AlertCircle size={18} className="mt-0.5 shrink-0" /> {analysisError}
              </div>
            )}

            {/* STATE: Setup Form */}
            {activeMode === "setup" && !loading && (
              <div className="bg-[#16181f]/80 backdrop-blur-3xl border border-[#2a2d3a] rounded-[2rem] p-8 lg:p-10 shadow-2xl max-w-4xl mx-auto mb-16 relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#6c63ff]/20 to-[#4caf8a]/10 rounded-[2rem] blur-2xl -z-10 opacity-70" />

                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Database className="text-[#6c63ff]" size={26} /> Data Connection
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openPremiumDashboards}
                      className="bg-gradient-to-r from-[#4caf8a] to-[#34d399] hover:from-[#3d9371] hover:to-[#2fc288] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(76,175,138,0.3)] transition-all"
                    >
                      <LayoutDashboard size={18} /> 4 Premium Dashboards
                    </button>
                    <button
                      onClick={runAutoDashboard}
                      disabled={!hasSession && !datasetLink}
                      className="bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] hover:from-[#5b52e3] hover:to-[#9176f5] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(108,99,255,0.3)] transition-all disabled:opacity-50"
                    >
                      <Sparkles size={18} /> Generate 3 AI Dashboards
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <div>
                    <label className="text-sm font-bold text-[#8a8fa8] mb-3 flex items-center gap-2 uppercase tracking-wide">
                      Dataset Context
                      {hasSession && <span className="ml-2 flex items-center gap-1 text-[#4caf8a] text-[10px] font-black uppercase tracking-widest bg-[#4caf8a]/10 px-2 py-0.5 rounded-full"><Check size={10} /> Active</span>}
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
                          <UploadCloud size={16} className="text-[#6c63ff]" /> Upload CSV
                          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#8a8fa8] mb-3 flex items-center gap-2 uppercase tracking-wide">Or Use Custom Natural Language</label>
                    <QueryBox query={query} setQuery={setQuery} onAnalyze={runCustomAnalysis} loading={loading} disabled={selectedCharts.length === 0} />
                  </div>
                  <div>
                    <ChartSelector selectedCharts={selectedCharts} onToggle={c => setSelectedCharts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} />
                  </div>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="flex justify-center flex-col items-center py-32 text-[#8a8fa8]">
                <Activity size={48} className="animate-spin text-[#6c63ff] mb-6" />
                <p className="font-bold text-xl tracking-wide animate-pulse text-white">Synthesizing Visual Intelligence...</p>
                <p className="text-sm mt-2">LLM Agents are cleaning, modeling, and executing queries.</p>
              </div>
            )}

            {/* STATE: Custom Single Dashboard View */}
            {activeMode === "custom_view" && customResult && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
                <div className="flex justify-between items-end mb-10 pb-6 border-b border-[#2a2d3a]">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white mb-2">{customResult.title || "Custom Analysis Dashboard"}</h2>
                    <p className="text-[#8a8fa8] font-medium"><Database size={14} className="inline mr-2 text-[#4caf8a]"/> {customResult.rows_returned} entities returned in query.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {customKPIs.map((kpi, i) => (
                    <KPICard key={i} title={kpi.title} value={kpi.value} subValue={kpi.subValue} icon={kpi.icon} colorClass={kpi.colorClass} trend={i===1 ? 8.4 : null} />
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {selectedCharts.map((chartType) => (
                    <ChartCard key={chartType} title={`${chartType} Perspective`} className={`min-h-[420px] bg-[#16181f]/40 backdrop-blur-3xl border-[#2a2d3a]/60 shadow-none hover:shadow-xl ${["area", "line"].includes(chartType) ? "lg:col-span-2" : ""}`}>
                      <DynamicChart chartType={chartType} data={customResult.data} xAxis={customResult.x_axis} yAxis={customResult.y_axis} />
                    </ChartCard>
                  ))}
                </div>
              </div>
            )}

            {/* STATE: Auto Dashboard Gallery View */}
            {activeMode === "auto_gallery" && autoResult && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="text-[#6c63ff]" size={28} /> AI Generated Dashboards
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {autoResult.dashboards.map((dash, idx) => (
                    <div
                      key={idx}
                      onClick={() => openDashboardDetail(dash)}
                      className="group cursor-pointer bg-[#16181f]/90 backdrop-blur-xl border border-[#2a2d3a] rounded-[2rem] p-8 hover:bg-[#1e2029] hover:border-[#6c63ff]/60 hover:shadow-[0_10px_35px_rgba(108,99,255,0.15)] hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col h-full"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6c63ff] to-[#4caf8a] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-[#6c63ff]/10 text-[#6c63ff] flex items-center justify-center border border-[#6c63ff]/20">
                          <LayoutDashboard size={26} />
                        </div>
                        <span className="text-xs font-bold text-[#4caf8a] bg-[#4caf8a]/10 px-3 py-1.5 rounded-full border border-[#4caf8a]/20">
                          {dash.charts.length} Charts
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{dash.title}</h3>
                      <p className="text-[#8a8fa8] text-sm leading-relaxed mb-8 flex-1">{dash.description}</p>
                      <div className="text-xs font-bold uppercase tracking-widest text-[#6c63ff] group-hover:text-white transition-colors flex items-center justify-between">
                        View Dashboard <span>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STATE: Auto Dashboard Detail View */}
            {activeMode === "auto_detail" && activeDashboard && (
              <div className="animate-in fade-in zoom-in-95 duration-500 pb-20">
                
                <button
                  onClick={exitDashboardDetail}
                  className="flex items-center gap-2 text-[#8a8fa8] hover:text-white font-medium mb-8 transition-colors"
                >
                  <ChevronLeft size={18} /> Back to dashboard gallery
                </button>

                {/* Dashboard Header & Voice Player */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10 bg-[#16181f] p-8 lg:px-12 rounded-[2rem] border border-[#2a2d3a] shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#6c63ff]/5 pointer-events-none" />
                  
                  <div>
                    <h1 className="text-4xl font-extrabold text-white mb-3">{activeDashboard.title}</h1>
                    <p className="text-[#8a8fa8] text-lg max-w-2xl">{activeDashboard.description}</p>
                  </div>

                  <button
                    onClick={() => toggleVoiceScript(activeDashboard.voice_script)}
                    className={`shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${isPlaying ? "bg-[#ff5e5e] text-white hover:bg-[#ff4040]" : "bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPlaying ? "bg-white text-[#ff5e5e]" : "bg-black text-white"}`}>
                      {isPlaying ? <span className="block w-2.5 h-2.5 bg-[#ff5e5e] rounded-sm" /> : <Play fill="white" size={14} className="ml-0.5" />}
                    </div>
                    {isPlaying ? "Stop Briefing" : "Play AI Briefing"}
                  </button>
                </div>

                {/* AI Insights Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {activeDashboard.insights && activeDashboard.insights.slice(0, 2).map((insight, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-[#1e2029] to-[#16181f] border border-[#2a2d3a] p-5 rounded-2xl flex items-start gap-4 shadow-lg">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#ff9800] ring-4 ring-[#ff9800]/20 shrink-0" />
                      <p className="text-[#f0f0f5] text-sm font-medium leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>

                {/* KPI Cards mapped from primary subchart */}
                {autoKPIs.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {autoKPIs.map((kpi, i) => (
                       <KPICard key={i} title={kpi.title} value={kpi.value} subValue={kpi.subValue} icon={kpi.icon} colorClass={kpi.colorClass} trend={i === 1 ? 9.2 : (i === 2 ? 14.1 : null)} />
                    ))}
                  </div>
                )}

                {/* Chart Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {activeDashboard.charts.map((chart, idx) => (
                    <ChartCard key={idx} title={chart.title} className="min-h-[420px] bg-[#0e0f14] border-[#2a2d3a]">
                      {chart.error ? (
                        <div className="flex items-center justify-center h-full text-[#ff5e5e] text-sm px-4 text-center">
                          <AlertCircle className="mr-2 shrink-0" size={16} /> Data Error: {chart.error}
                        </div>
                      ) : (
                        <DynamicChart chartType={chart.chart_type} xAxis={chart.x_axis} yAxis={chart.y_axis} data={chart.data} />
                      )}
                    </ChartCard>
                  ))}
                </div>

              </div>
            )}

            {/* STATE: Premium Dashboards */}
            {activeMode === "dashboard_view" && !loading && customResult && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
                {/* Answer Section */}
                <div className="mb-12">
                  <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">📊 Analysis Result</h2>
                    <p className="text-[#8a8fa8] text-lg leading-relaxed mb-6">{customResult.title || "Query Analysis"}</p>
                    <div className="flex items-center gap-2 text-[#4caf8a] text-sm font-medium">
                      <Check size={18} />
                      <span>{customResult.rows_returned} entities returned</span>
                    </div>
                  </div>
                </div>

                {/* KPIs Section */}
                <div className="mb-12">
                  <h3 className="text-xl font-bold text-white mb-6">Key Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {customKPIs.map((kpi, i) => (
                      <KPICard key={i} title={kpi.title} value={kpi.value} subValue={kpi.subValue} icon={kpi.icon} colorClass={kpi.colorClass} trend={i===1 ? 8.4 : null} />
                    ))}
                  </div>
                </div>

                {/* Dashboards Section */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Interactive Dashboards</h3>
                  <DashboardView charts={selectedCharts} datasetId={datasetLink} />
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
