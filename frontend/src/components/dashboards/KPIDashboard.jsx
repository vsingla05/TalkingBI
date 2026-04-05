import React, { useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Zap, Volume2, Loader, Play, Square, Pause } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, ScatterChart, Scatter } from "recharts";

const COLORS = ["#6c63ff", "#4caf8a", "#ff9800", "#e91e63", "#00bcd4", "#a78bfa", "#34d399"];

export default function KPIDashboard({ charts, kpis = [], onVoiceSummary, isPlayingAudio = false, isPausedAudio = false, onStopAudio, onPauseAudio, onResumeAudio, dashboardData = null }) {
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef(null);

  // Sync isPlaying and isPaused with parent props
  useEffect(() => {
    setIsPlaying(isPlayingAudio);
    setIsPaused(isPausedAudio);
  }, [isPlayingAudio, isPausedAudio]);

  // Use dynamic data if provided, otherwise use mock data
  const displayKPIs = (dashboardData?.kpis && Array.isArray(dashboardData.kpis) && dashboardData.kpis.length > 0) 
    ? dashboardData.kpis 
    : [
        { label: "Revenue", value: "$2.4M", change: "+12.5%", positive: true, icon: "💰", trend: [10, 15, 12, 18, 22, 25, 28] },
        { label: "Growth Rate", value: "24.5%", change: "+8.2%", positive: true, icon: "📈", trend: [15, 18, 16, 22, 26, 28, 31] },
        { label: "Active Users", value: "12.4K", change: "+5.3%", positive: true, icon: "👥", trend: [8, 10, 9, 14, 16, 18, 20] },
        { label: "Conversion", value: "3.8%", change: "-2.1%", positive: false, icon: "🎯", trend: [5, 4.8, 4.5, 4.2, 4, 3.9, 3.8] },
      ];

  const displayCharts = (dashboardData?.charts && Array.isArray(dashboardData.charts)) ? dashboardData.charts : (charts && Array.isArray(charts) ? charts : []);

  const handleVoiceSummary = async () => {
    setIsGeneratingVoice(true);
    try {
      const summary = {
        kpis: displayKPIs,
        charts: displayCharts,
        insight: dashboardData?.insight || "Summary of KPI performance indicators",
      };
      await onVoiceSummary("kpi", summary);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const toggleVoiceSummary = () => {
    if (isPlaying && !isPaused) {
      // Currently playing -> pause
      if (onPauseAudio) onPauseAudio();
    } else if (isPaused) {
      // Currently paused -> resume
      if (onResumeAudio) onResumeAudio();
    } else {
      // Not playing -> start
      handleVoiceSummary();
    }
  };

  return (
    <div className="space-y-6 pb-12 px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{dashboardData?.title || "KPI Overview"}</h1>
          <p className="text-[#8a8fa8] mt-2">{dashboardData?.insight || "Real-time key performance indicators"}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleVoiceSummary}
            disabled={isGeneratingVoice}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              isPlaying
                ? "bg-[#ff9800] hover:bg-[#ff8800]"
                : isPaused
                ? "bg-[#4caf8a] hover:bg-[#45a080]"
                : "bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] hover:shadow-lg hover:shadow-[#6c63ff]/30"
            } text-white disabled:opacity-50`}
          >
            {isGeneratingVoice ? (
              <>
                <Loader size={18} className="animate-spin" />
                Generating...
              </>
            ) : isPlaying ? (
              <>
                <Pause size={18} />
                Pause
              </>
            ) : isPaused ? (
              <>
                <Play size={18} />
                Resume
              </>
            ) : (
              <>
                <Play size={18} />
                Hear Summary
              </>
            )}
          </button>
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsPlaying(false);
              setIsPaused(false);
              if (onStopAudio) onStopAudio();
            }}
            disabled={!isPlaying && !isPaused}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all bg-[#2a2d3a] hover:bg-[#ff5e5e] text-white disabled:opacity-30"
          >
            <Square size={18} />
            Stop
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayKPIs.map((kpi, idx) => {
          // Determine if this is a positive change (for styling)
          const isPositive = kpi.change === null || kpi.change === undefined 
            ? true 
            : (typeof kpi.change === 'string' ? kpi.change.includes('+') : kpi.change >= 0);
          
          // Generate dummy trend data if not provided
          const trendData = kpi.trend || [Math.random() * 20 + 10, Math.random() * 20 + 15, Math.random() * 20 + 12, Math.random() * 20 + 18, Math.random() * 20 + 22, Math.random() * 20 + 25, Math.random() * 20 + 28];
          
          return (
            <div
              key={idx}
              className="group bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6 hover:border-[#6c63ff]/30 transition-all hover:shadow-lg hover:shadow-[#6c63ff]/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{kpi.icon || (idx % 4 === 0 ? '💰' : idx % 4 === 1 ? '📈' : idx % 4 === 2 ? '👥' : '🎯')}</div>
                {isPositive ? (
                  <TrendingUp size={20} className="text-[#4caf8a]" />
                ) : (
                  <TrendingDown size={20} className="text-[#ff5e5e]" />
                )}
              </div>
              <p className="text-[#8a8fa8] text-sm font-medium mb-2">{kpi.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-white mb-3">{kpi.value}</p>
              <div className={`text-sm font-semibold ${isPositive ? "text-[#4caf8a]" : "text-[#ff5e5e]"}`}>
                {kpi.change || ""}
              </div>

              {/* Sparkline */}
              <div className="mt-4 h-12 opacity-60 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData.map((val, i) => ({ value: val, index: i }))}>
                    <defs>
                      <linearGradient id={`grad${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "#4caf8a" : "#ff5e5e"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isPositive ? "#4caf8a" : "#ff5e5e"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={isPositive ? "#4caf8a" : "#ff5e5e"}
                      fill={`url(#grad${idx})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayCharts && displayCharts.length > 0 ? (
          displayCharts.map((chart, idx) => (
            <div key={idx} className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{chart.title || `Chart ${idx + 1}`}</h3>
              <div className="h-80">
                {chart.data && chart.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {(chart.type === "bar" || !chart.type) && (
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                        <XAxis dataKey={chart.x_axis} stroke="#8a8fa8" />
                        <YAxis stroke="#8a8fa8" />
                        <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                        <Legend />
                        <Bar dataKey={chart.y_axis} fill="#6c63ff" radius={[8, 8, 0, 0]}>
                          {chart.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    )}
                    {chart.type === "line" && (
                      <LineChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                        <XAxis dataKey={chart.x_axis} stroke="#8a8fa8" />
                        <YAxis stroke="#8a8fa8" />
                        <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                        <Legend />
                        <Line type="monotone" dataKey={chart.y_axis} stroke="#00bcd4" strokeWidth={3} dot={{ fill: "#00bcd4", r: 5 }} />
                      </LineChart>
                    )}
                    {chart.type === "area" && (
                      <AreaChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                        <XAxis dataKey={chart.x_axis} stroke="#8a8fa8" />
                        <YAxis stroke="#8a8fa8" />
                        <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                        <Legend />
                        <Area type="monotone" dataKey={chart.y_axis} stroke="#4caf8a" fill="#4caf8a" fillOpacity={0.3} />
                      </AreaChart>
                    )}
                    {chart.type === "pie" && (
                      <PieChart>
                        <Pie data={chart.data} dataKey={chart.y_axis} nameKey={chart.x_axis} cx="50%" cy="50%" outerRadius={100} label>
                          {chart.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                        <Legend />
                      </PieChart>
                    )}
                    {chart.type === "scatter" && (
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                        <XAxis type="number" dataKey={chart.x_axis} stroke="#8a8fa8" />
                        <YAxis type="number" dataKey={chart.y_axis} stroke="#8a8fa8" />
                        <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                        <Scatter name="Data" data={chart.data} fill="#ff9800" />
                      </ScatterChart>
                    )}
                    {chart.type === "histogram" && (
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                        <XAxis dataKey={chart.x_axis} stroke="#8a8fa8" />
                        <YAxis stroke="#8a8fa8" />
                        <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                        <Legend />
                        <Bar dataKey={chart.y_axis} fill="#a78bfa" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#8a8fa8]">No data available</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-[#8a8fa8] py-12">
            No charts available for this dashboard
          </div>
        )}
      </div>
    </div>
  );
}
