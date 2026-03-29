import React, { useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Zap, Volume2, Loader, Play, Square } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const COLORS = ["#6c63ff", "#4caf8a", "#ff9800", "#e91e63", "#00bcd4", "#a78bfa", "#34d399"];

export default function KPIDashboard({ charts, kpis = [], onVoiceSummary, isPlayingAudio = false, onStopAudio }) {
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Sync isPlaying with parent isPlayingAudio prop
  React.useEffect(() => {
    setIsPlaying(isPlayingAudio);
  }, [isPlayingAudio]);

  const mockKPIs = [
    { label: "Revenue", value: "$2.4M", change: "+12.5%", positive: true, icon: "💰", trend: [10, 15, 12, 18, 22, 25, 28] },
    { label: "Growth Rate", value: "24.5%", change: "+8.2%", positive: true, icon: "📈", trend: [15, 18, 16, 22, 26, 28, 31] },
    { label: "Active Users", value: "12.4K", change: "+5.3%", positive: true, icon: "👥", trend: [8, 10, 9, 14, 16, 18, 20] },
    { label: "Conversion", value: "3.8%", change: "-2.1%", positive: false, icon: "🎯", trend: [5, 4.8, 4.5, 4.2, 4, 3.9, 3.8] },
  ];

  // Mock chart data
  const revenueData = [
    { name: "Jan", revenue: 4000, target: 5000 },
    { name: "Feb", revenue: 3000, target: 4500 },
    { name: "Mar", revenue: 2000, target: 4000 },
    { name: "Apr", revenue: 2780, target: 5000 },
    { name: "May", revenue: 1890, target: 4500 },
    { name: "Jun", revenue: 2390, target: 5500 },
    { name: "Jul", revenue: 3490, target: 6000 },
  ];

  const userTrendData = [
    { month: "Week 1", users: 400, engaged: 240 },
    { month: "Week 2", users: 3000, engaged: 1398 },
    { month: "Week 3", users: 2000, engaged: 1800 },
    { month: "Week 4", users: 2780, engaged: 980 },
    { month: "Week 5", users: 1890, engaged: 1800 },
    { month: "Week 6", users: 2390, engaged: 1800 },
    { month: "Week 7", users: 3490, engaged: 2100 },
  ];

  const handleVoiceSummary = async () => {
    setIsGeneratingVoice(true);
    try {
      const dashboardData = {
        kpis: mockKPIs,
        charts: charts,
        insights: [
          { text: "Revenue shows strong growth trend with 12.5% increase" },
          { text: "User engagement is at peak levels with 12.4K active users" },
          { text: "Conversion rate slight decline suggests need for optimization" },
        ],
      };
      await onVoiceSummary("kpi", dashboardData);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const toggleVoiceSummary = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      if (onStopAudio) onStopAudio();
    } else {
      handleVoiceSummary();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">KPI Overview</h1>
          <p className="text-[#8a8fa8] mt-2">Real-time key performance indicators</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleVoiceSummary}
            disabled={isGeneratingVoice}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              isPlaying
                ? "bg-[#ff5e5e] hover:bg-[#ff4040]"
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
                <Square size={18} />
                Stop
              </>
            ) : (
              <>
                <Play size={18} />
                Hear Summary
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockKPIs.map((kpi, idx) => (
          <div
            key={idx}
            className="group bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6 hover:border-[#6c63ff]/30 transition-all hover:shadow-lg hover:shadow-[#6c63ff]/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{kpi.icon}</div>
              {kpi.positive ? (
                <TrendingUp size={20} className="text-[#4caf8a]" />
              ) : (
                <TrendingDown size={20} className="text-[#ff5e5e]" />
              )}
            </div>
            <p className="text-[#8a8fa8] text-sm font-medium mb-2">{kpi.label}</p>
            <p className="text-2xl md:text-3xl font-bold text-white mb-3">{kpi.value}</p>
            <div className={`text-sm font-semibold ${kpi.positive ? "text-[#4caf8a]" : "text-[#ff5e5e]"}`}>
              {kpi.change}
            </div>

            {/* Sparkline */}
            <div className="mt-4 h-12 opacity-60 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpi.trend.map((val, i) => ({ value: val, index: i }))}>
                  <defs>
                    <linearGradient id={`grad${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={kpi.positive ? "#4caf8a" : "#ff5e5e"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={kpi.positive ? "#4caf8a" : "#ff5e5e"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={kpi.positive ? "#4caf8a" : "#ff5e5e"}
                    fill={`url(#grad${idx})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Target Chart */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue vs Target</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="name" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Bar dataKey="revenue" fill="#6c63ff" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#4caf8a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Trend */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth & Engagement</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="month" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#00bcd4" strokeWidth={3} dot={{ fill: "#00bcd4", r: 5 }} />
                <Line type="monotone" dataKey="engaged" stroke="#4caf8a" strokeWidth={3} dot={{ fill: "#4caf8a", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional charts from data if provided */}
        {charts && charts.slice(0, 2).map((chart, idx) => (
          <div key={idx} className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{chart.title}</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                  <XAxis dataKey={chart.xAxis} stroke="#8a8fa8" />
                  <YAxis stroke="#8a8fa8" />
                  <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey={chart.yAxis} stroke="#6c63ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
