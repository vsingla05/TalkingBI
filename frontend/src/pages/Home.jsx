import { useState, useEffect } from "react";
import { LinkIcon, Activity, Zap, Database, Check, AlertCircle, ExternalLink } from "lucide-react";
import api from "../api/client";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import QueryBox from "../components/QueryBox";
import ChartSelector from "../components/ChartSelector";
import ChartCard from "../components/ChartCard";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area,
  ScatterChart, Scatter,
} from "recharts";

const COLORS = ["#6c63ff", "#4caf8a", "#ff9800", "#e91e63", "#00bcd4", "#a78bfa", "#34d399"];

// ─────────────────────────────────────────────────────────────────────────────
// Universal Dynamic Chart
// Renders any chart type using real backend x_axis / y_axis column names.
// ─────────────────────────────────────────────────────────────────────────────
function DynamicChart({ chartType, data, xAxis, yAxis }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#8a8fa8] text-sm">
        No data available
      </div>
    );
  }

  const gridEl    = <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />;
  const xEl       = <XAxis dataKey={xAxis} stroke="#8a8fa8" tick={{ fill: "#8a8fa8", fontSize: 12 }} interval="preserveStartEnd" />;
  const yEl       = <YAxis stroke="#8a8fa8" tick={{ fill: "#8a8fa8", fontSize: 12 }} />;
  const tipEl     = <Tooltip contentStyle={{ backgroundColor: "#1e2029", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />;
  const legendEl  = <Legend wrapperStyle={{ fontSize: 12, color: "#8a8fa8" }} />;

  switch (chartType) {
    case "bar":
    case "histogram":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            {gridEl}{xEl}{yEl}{tipEl}{legendEl}
            <Bar dataKey={yAxis} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            {gridEl}{xEl}{yEl}{tipEl}{legendEl}
            <Line type="monotone" dataKey={yAxis} stroke="#6c63ff" strokeWidth={3}
              dot={{ fill: "#6c63ff", r: 4 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            {gridEl}{xEl}{yEl}{tipEl}{legendEl}
            <Area type="monotone" dataKey={yAxis} stroke="#6c63ff"
              fill="url(#areaGrad)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {tipEl}{legendEl}
            <Pie data={data} dataKey={yAxis} nameKey={xAxis}
              cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );

    case "scatter":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            {gridEl}
            <XAxis type="number" dataKey={xAxis} name={xAxis}
              stroke="#8a8fa8" tick={{ fill: "#8a8fa8", fontSize: 12 }} />
            <YAxis type="number" dataKey={yAxis} name={yAxis}
              stroke="#8a8fa8" tick={{ fill: "#8a8fa8", fontSize: 12 }} />
            {tipEl}{legendEl}
            <Scatter name={`${xAxis} vs ${yAxis}`} data={data} fill="#6c63ff" />
          </ScatterChart>
        </ResponsiveContainer>
      );

    default:
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            {gridEl}{xEl}{yEl}{tipEl}{legendEl}
            <Bar dataKey={yAxis} fill="#4caf8a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Home Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [datasetLink, setDatasetLink]       = useState("");
  const [query, setQuery]                   = useState("");
  const [selectedCharts, setSelectedCharts] = useState(["bar", "line", "pie"]);
  const [loading, setLoading]               = useState(false);
  const [hasSession, setHasSession]         = useState(false);
  const [result, setResult]                 = useState(null);
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

  const handleToggleChart = (chartId) =>
    setSelectedCharts(prev =>
      prev.includes(chartId) ? prev.filter(c => c !== chartId) : [...prev, chartId]
    );

  const handleAnalyze = async () => {
    if (!query.trim() || selectedCharts.length === 0) return;

    setLoading(true);
    setResult(null);
    setAnalysisError(null);

    try {
      const response = await api.post("/analyze", {
        dataset_link: datasetLink.trim() || null,
        query: query.trim(),
        requested_charts: selectedCharts,
      });

      console.log("✅ Pipeline result:", response.data);
      if (response.data.dataset_id) setHasSession(true);
      setResult(response.data);

    } catch (err) {
      console.error("Pipeline error:", err);
      setAnalysisError(
        err.response?.data?.detail?.message ||
        "Analysis failed. Check your dataset URL or rephrase your query."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0e0f14] text-[#f0f0f5] overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-8 py-10">
          <div className="max-w-[1400px] mx-auto">

            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8a8fa8]">
                Intelligence Hub
              </h1>
              <p className="text-lg text-[#8a8fa8] mt-2 font-medium flex items-center gap-2">
                <Activity size={18} className="text-[#6c63ff]" />
                AI-powered agentic analytics — ingest, clean, query, visualize.
              </p>
            </div>

            {/* ── Command Form ─────────────────────────────────────── */}
            <div className="bg-[#16181f] border border-[#2a2d3a] rounded-[2rem] p-8 lg:p-10 shadow-2xl shadow-black/40 max-w-4xl mx-auto mb-16 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-[#6c63ff]/20 to-[#4caf8a]/10 rounded-[2rem] blur-2xl -z-10 opacity-70" />

              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Database className="text-[#6c63ff]" size={26} />
                New Analysis Request
              </h2>

              <div className="flex flex-col gap-8">

                {/* Step 1 — Dataset Link */}
                <div>
                  <label className="text-sm font-bold text-[#8a8fa8] mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <div className="w-6 h-6 rounded-full bg-[#1e2029] flex items-center justify-center text-[#6c63ff] border border-[#2a2d3a] text-xs">1</div>
                    Dataset Link
                    {hasSession && (
                      <span className="ml-2 flex items-center gap-1 text-[#4caf8a] text-[10px] font-black uppercase tracking-widest">
                        <Check size={10} /> Session Active
                      </span>
                    )}
                  </label>
                  <div className={`flex items-center gap-3 bg-[#0e0f14] border p-2.5 rounded-2xl transition-all ${
                    hasSession ? "border-[#4caf8a]/30" : "border-[#2a2d3a] focus-within:border-[#6c63ff] focus-within:shadow-[0_0_15px_rgba(108,99,255,0.1)]"
                  }`}>
                    <div className={`p-2.5 rounded-xl ${hasSession ? "bg-[#4caf8a]/10 text-[#4caf8a]" : "bg-[#1e2029] text-[#4caf8a]"}`}>
                      <LinkIcon size={18} />
                    </div>
                    <input
                      type="text"
                      value={datasetLink}
                      onChange={e => { setDatasetLink(e.target.value); setHasSession(false); }}
                      placeholder={hasSession ? "Active session — paste new URL to switch dataset…" : "Paste public CSV URL or Google Sheets link…"}
                      className="bg-transparent border-none text-[1.05rem] text-white flex-1 min-w-0 outline-none placeholder:text-[#8a8fa8]/30 px-2 font-medium"
                    />
                  </div>
                </div>

                {/* Step 2 — Query + Voice + Submit */}
                <div>
                  <label className="text-sm font-bold text-[#8a8fa8] mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <div className="w-6 h-6 rounded-full bg-[#1e2029] flex items-center justify-center text-[#6c63ff] border border-[#2a2d3a] text-xs">2</div>
                    KPI Question
                  </label>
                  <QueryBox
                    query={query}
                    setQuery={setQuery}
                    onAnalyze={handleAnalyze}
                    loading={loading}
                    disabled={selectedCharts.length === 0}
                  />
                  {!hasSession && !datasetLink && (
                    <p className="mt-3 text-xs text-[#ff9800]/70 italic">
                      Paste a dataset URL above before running analysis.
                    </p>
                  )}
                </div>

                {/* Step 3 — Chart Types */}
                <div>
                  <label className="text-sm font-bold text-[#8a8fa8] mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <div className="w-6 h-6 rounded-full bg-[#1e2029] flex items-center justify-center text-[#6c63ff] border border-[#2a2d3a] text-xs">3</div>
                    Preferred Visuals
                  </label>
                  <ChartSelector selectedCharts={selectedCharts} onToggle={handleToggleChart} />
                </div>

              </div>
            </div>

            {/* ── Error Banner ──────────────────────────────────────── */}
            {analysisError && (
              <div className="max-w-4xl mx-auto mb-10 flex items-start gap-3 bg-[#ff5e5e]/10 border border-[#ff5e5e]/30 text-[#ff5e5e] px-6 py-4 rounded-2xl text-sm font-semibold">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {analysisError}
              </div>
            )}

            {/* ── Real Pipeline Results ──────────────────────────────── */}
            {result && (
              <div className="pb-24 border-t border-[#2a2d3a] pt-14">
                {/* Results header */}
                <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Zap className="text-[#ff9800] fill-[#ff9800]" size={28} />
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                      {result.title || "Analysis Results"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-[#8a8fa8] bg-[#16181f] border border-[#2a2d3a] px-4 py-2 rounded-xl font-mono">
                      {result.rows_returned} rows
                    </div>
                    <div className="text-xs text-[#6c63ff] bg-[#6c63ff]/10 border border-[#6c63ff]/30 px-4 py-2 rounded-xl font-mono">
                      {result.x_axis} → {result.y_axis}
                    </div>
                  </div>
                </div>

                {/* Collapsible SQL badge */}
                <details className="mb-10 bg-[#0e0f14] border border-[#2a2d3a] rounded-2xl overflow-hidden">
                  <summary className="cursor-pointer px-6 py-3 text-xs font-bold text-[#8a8fa8] uppercase tracking-widest flex items-center gap-2 hover:text-[#6c63ff] transition-colors select-none">
                    <ExternalLink size={12} /> View Generated SQL
                  </summary>
                  <pre className="text-xs text-[#4caf8a] font-mono px-6 py-5 overflow-x-auto border-t border-[#2a2d3a] leading-relaxed">
{result.sql_query}
                  </pre>
                </details>

                {/* Chart grid with real pipeline data */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {selectedCharts.map((chartType) => (
                    <ChartCard
                      key={chartType}
                      title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} — ${result.title || query}`}
                      className={["line", "area"].includes(chartType) ? "md:col-span-2 xl:col-span-2 min-h-[400px]" : "min-h-[380px]"}
                    >
                      <DynamicChart
                        chartType={chartType}
                        data={result.data}
                        xAxis={result.x_axis}
                        yAxis={result.y_axis}
                      />
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
