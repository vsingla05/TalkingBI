import React, { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, PieChart, Pie, Cell } from "recharts";
import { Loader, Filter, Play, Square, Pause } from "lucide-react";

const COLORS = ["#6c63ff", "#4caf8a", "#ff9800", "#e91e63", "#00bcd4", "#a78bfa", "#34d399"];

export default function AnalyticsDashboard({ charts, onVoiceSummary, isPlayingAudio = false, isPausedAudio = false, onStopAudio, onPauseAudio, onResumeAudio }) {
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("all");

  // Sync isPlaying and isPaused with parent props
  useEffect(() => {
    setIsPlaying(isPlayingAudio);
    setIsPaused(isPausedAudio);
  }, [isPlayingAudio, isPausedAudio]);

  const metrics = ["Revenue", "Users", "Engagement", "Conversion", "Retention"];

  // Mock data
  const monthlyData = [
    { month: "Jan", revenue: 4000, users: 2400, engagement: 2400 },
    { month: "Feb", revenue: 3000, users: 1398, engagement: 2210 },
    { month: "Mar", revenue: 2000, users: 9800, engagement: 2290 },
    { month: "Apr", revenue: 2780, users: 3908, engagement: 2000 },
    { month: "May", revenue: 1890, users: 4800, engagement: 2181 },
    { month: "Jun", revenue: 2390, users: 3800, engagement: 2500 },
  ];

  const categoryData = [
    { name: "Category A", value: 4000 },
    { name: "Category B", value: 3000 },
    { name: "Category C", value: 2000 },
    { name: "Category D", value: 2780 },
  ];

  const trendData = [
    { week: "W1", value: 65, previous: 45 },
    { week: "W2", value: 59, previous: 52 },
    { week: "W3", value: 80, previous: 61 },
    { week: "W4", value: 81, previous: 55 },
    { week: "W5", value: 56, previous: 48 },
    { week: "W6", value: 55, previous: 40 },
  ];

  const handleVoiceSummary = async () => {
    setIsGeneratingVoice(true);
    setIsPlaying(true);
    try {
      const dashboardData = {
        charts: charts,
        insights: [
          { text: "Revenue trending upward with consistent month-over-month growth" },
          { text: "User acquisition accelerating, particularly in Q3 and Q4" },
          { text: "Engagement metrics show strong correlation with marketing campaigns" },
          { text: "Conversion optimization has significant improvement opportunity" },
        ],
      };
      await onVoiceSummary("analytics", dashboardData);
    } finally {
      setIsGeneratingVoice(false);
      setIsPlaying(false);
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-[#8a8fa8] mt-2">Comprehensive analysis and trends</p>
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
                : "bg-gradient-to-r from-[#00bcd4] to-[#4caf8a] hover:shadow-lg hover:shadow-[#00bcd4]/30"
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

      {/* Metric Filter */}
      <div className="bg-gradient-to-r from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={18} className="text-[#00bcd4]" />
          <span className="text-white font-semibold">Filter Metrics</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", ...metrics].map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedMetric === metric
                  ? "bg-[#00bcd4] text-white shadow-lg shadow-[#00bcd4]/30"
                  : "bg-[#2a2d3a] text-[#8a8fa8] hover:bg-[#343847]"
              }`}
            >
              {metric === "all" ? "All Metrics" : metric}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Monthly Revenue & Users</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Revenue trend over time</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="month" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="#6c63ff" strokeWidth={2} />
                <Line type="monotone" dataKey="users" stroke="#00bcd4" strokeWidth={3} dot={{ fill: "#00bcd4", r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Category Distribution</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Revenue by category</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Weekly Trend Analysis</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Current vs Previous week</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="week" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Bar dataKey="value" fill="#4caf8a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="previous" fill="#ff9800" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Engagement Over Time</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">User engagement metrics</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00bcd4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="month" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Area type="monotone" dataKey="engagement" stroke="#00bcd4" fill="url(#colorEngage)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
