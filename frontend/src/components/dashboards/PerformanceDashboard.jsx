import React, { useState, useEffect } from "react";
import { Loader, Play, Square, Pause } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, ScatterChart, Scatter } from "recharts";

const COLORS = ["#ff9800", "#ff5e5e", "#4caf8a", "#6c63ff", "#00bcd4", "#a78bfa", "#34d399"];

export default function PerformanceDashboard({ charts, dashboardData = null, onVoiceSummary, isPlayingAudio = false, isPausedAudio = false, onStopAudio, onPauseAudio, onResumeAudio }) {
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setIsPlaying(isPlayingAudio);
    setIsPaused(isPausedAudio);
  }, [isPlayingAudio, isPausedAudio]);

  const displayKPIs = dashboardData?.kpis && Array.isArray(dashboardData.kpis) ? dashboardData.kpis : [];
  const displayCharts = dashboardData?.charts && Array.isArray(dashboardData.charts) ? dashboardData.charts : (charts || []);

  const handleVoiceSummary = async () => {
    setIsGeneratingVoice(true);
    try {
      const summary = {
        kpis: displayKPIs,
        charts: displayCharts,
        insight: dashboardData?.insight || "System health and efficiency metrics",
      };
      await onVoiceSummary("performance", summary);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const toggleVoiceSummary = () => {
    if (isPlaying && !isPaused) {
      if (onPauseAudio) onPauseAudio();
    } else if (isPaused) {
      if (onResumeAudio) onResumeAudio();
    } else {
      handleVoiceSummary();
    }
  };

  return (
    <div className="space-y-6 pb-12 px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{dashboardData?.title || "Performance Dashboard"}</h1>
          <p className="text-[#8a8fa8] mt-2">{dashboardData?.insight || "System health and efficiency metrics"}</p>
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
                : "bg-gradient-to-r from-[#ff9800] to-[#ff5e5e] hover:shadow-lg hover:shadow-[#ff9800]/30"
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
      {displayKPIs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {displayKPIs.map((kpi, idx) => (
            <div key={idx} className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6 hover:border-[#ff9800]/30 transition-all">
              <p className="text-[#8a8fa8] text-sm font-medium mb-2">{kpi.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-white mb-3">{kpi.value}</p>
              <div className={`text-sm font-semibold ${
                kpi.change && String(kpi.change).includes("-") ? "text-[#ff5e5e]" : "text-[#4caf8a]"
              }`}>
                {kpi.change || ""}
              </div>
              {kpi.description && <p className="text-xs text-[#6a6f8a] mt-2">{kpi.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Visualizations Grid */}
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
                        <Bar dataKey={chart.y_axis} fill="#ff9800" radius={[8, 8, 0, 0]}>
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
                        <Line type="monotone" dataKey={chart.y_axis} stroke="#ff9800" strokeWidth={3} dot={{ fill: "#ff9800", r: 5 }} />
                      </LineChart>
                    )}
                    {chart.type === "area" && (
                      <AreaChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                        <XAxis dataKey={chart.x_axis} stroke="#8a8fa8" />
                        <YAxis stroke="#8a8fa8" />
                        <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                        <Legend />
                        <Area type="monotone" dataKey={chart.y_axis} stroke="#ff5e5e" fill="#ff5e5e" fillOpacity={0.3} />
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
                        <XAxis type="category" dataKey={chart.x_axis} stroke="#8a8fa8" />
                        <YAxis type="number" dataKey={chart.y_axis} stroke="#8a8fa8" />
                        <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                        <Scatter name="Data" data={chart.data} fill="#4caf8a" />
                      </ScatterChart>
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
