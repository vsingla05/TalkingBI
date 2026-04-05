import React, { useState, useRef, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from "recharts";
import { Loader, Play, Square, Pause, TrendingUp } from "lucide-react";

const COLORS = ["#e91e63", "#ff5e5e", "#4caf8a", "#6c63ff"];

export default function InsightsDashboard({ charts, onVoiceSummary, isPlayingAudio = false, isPausedAudio = false, onStopAudio, onPauseAudio, onResumeAudio }) {
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Sync isPlaying and isPaused with parent props
  useEffect(() => {
    setIsPlaying(isPlayingAudio);
    setIsPaused(isPausedAudio);
  }, [isPlayingAudio, isPausedAudio]);

  // Mock data
  const anomalyData = [
    { timestamp: "00:00", value: 45, anomaly: 0 },
    { timestamp: "04:00", value: 52, anomaly: 0 },
    { timestamp: "08:00", value: 48, anomaly: 0 },
    { timestamp: "12:00", value: 95, anomaly: 95 },
    { timestamp: "16:00", value: 51, anomaly: 0 },
    { timestamp: "20:00", value: 49, anomaly: 0 },
  ];

  const segmentPerformanceData = [
    { segment: "Premium", revenue: 65000, growth: 15 },
    { segment: "Standard", revenue: 48000, growth: 8 },
    { segment: "Basic", revenue: 32000, growth: 5 },
    { segment: "Trial", revenue: 12000, growth: -2 },
  ];

  const correlationData = [
    { x: 20, y: 30, size: 400, name: "Feature A-B" },
    { x: 40, y: 50, size: 600, name: "Feature B-C" },
    { x: 50, y: 35, size: 500, name: "Feature C-D" },
    { x: 75, y: 70, size: 700, name: "Feature D-E" },
    { x: 30, y: 60, size: 550, name: "Feature E-F" },
    { x: 60, y: 80, size: 650, name: "Feature F-A" },
  ];

  const recommendationImpactData = [
    { week: "W1", adoptionRate: 5, impactScore: 8, recommendation: "A" },
    { week: "W2", adoptionRate: 12, impactScore: 18, recommendation: "B" },
    { week: "W3", adoptionRate: 25, impactScore: 35, recommendation: "C" },
    { week: "W4", adoptionRate: 38, impactScore: 52, recommendation: "D" },
    { week: "W5", adoptionRate: 48, impactScore: 65, recommendation: "E" },
  ];

  const handleVoiceSummary = async () => {
    setIsGeneratingVoice(true);
    setIsPlaying(true);
    try {
      const dashboardData = {
        charts: charts,
        insights: [
          { text: "Detected 1 anomaly in system behavior at 12:00 PM with 95 percent confidence score" },
          { text: "Premium segment driving 45 percent of total revenue with consistent 15 percent quarterly growth" },
          { text: "Recommendation set D shows highest correlation with business outcomes at 52 percent impact" },
          { text: "Week 5 adoption rate reached 48 percent, suggesting strong market receptiveness to recommendations" },
        ],
      };
      await onVoiceSummary("insights", dashboardData);
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
          <h1 className="text-3xl md:text-4xl font-bold text-white">AI Insights Dashboard</h1>
          <p className="text-[#8a8fa8] mt-2">Machine learning driven analytics and recommendations</p>
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
                : "bg-gradient-to-r from-[#e91e63] to-[#ff5e5e] hover:shadow-lg hover:shadow-[#e91e63]/30"
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

      {/* Insight Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Insights", value: "12", icon: "📊", color: "from-[#e91e63]" },
          { label: "Anomalies Detected", value: "1", icon: "⚠️", color: "from-[#ff5e5e]" },
          { label: "Avg Impact Score", value: "7.2/10", icon: "⭐", color: "from-[#4caf8a]" },
          { label: "Recommendation Rate", value: "48%", icon: "🎯", color: "from-[#6c63ff]" },
        ].map((metric, idx) => (
          <div key={idx} className={`bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#8a8fa8] text-sm font-medium">{metric.label}</p>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Detection */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Anomaly Detection</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">24-hour behavioral analysis</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={anomalyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00bcd4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="timestamp" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Area type="monotone" dataKey="value" fill="url(#colorValue)" stroke="#00bcd4" strokeWidth={2} name="Normal Value" />
                <Scatter dataKey="anomaly" fill="#ff5e5e" name="Anomaly Detected" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment Performance */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Segment Performance</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Revenue and growth by customer segment</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="segment" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Bar dataKey="revenue" fill="#e91e63" radius={[8, 8, 0, 0]} name="Revenue ($)" />
                <Bar dataKey="growth" fill="#4caf8a" radius={[8, 8, 0, 0]} name="Growth (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Correlation */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Feature Correlation Matrix</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Inter-feature correlation strength</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis type="number" dataKey="x" stroke="#8a8fa8" name="Feature A" />
                <YAxis type="number" dataKey="y" stroke="#8a8fa8" name="Feature B" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="Feature Pairs" data={correlationData} fill="#6c63ff" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendation Impact */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recommendation Impact</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Adoption rate and impact progression</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recommendationImpactData}>
                <defs>
                  <linearGradient id="colorAdoption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9800" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff9800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="week" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Line type="monotone" dataKey="adoptionRate" stroke="#ff9800" strokeWidth={3} dot={{ r: 5 }} name="Adoption Rate (%)" />
                <Line type="monotone" dataKey="impactScore" stroke="#4caf8a" strokeWidth={3} dot={{ r: 5 }} name="Impact Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-[#e91e63]" />
          Top Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Increase Premium Segment Focus", impact: "High", confidence: "92%" },
            { title: "Investigate 12:00 PM Anomaly", impact: "Critical", confidence: "95%" },
            { title: "Optimize Feature Pair D-E", impact: "Medium", confidence: "78%" },
            { title: "Expand Recommendation Set D", impact: "High", confidence: "85%" },
          ].map((rec, idx) => (
            <div key={idx} className="border border-[#2a2d3a] rounded-xl p-4 hover:border-[#e91e63]/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-white font-semibold text-sm">{rec.title}</h4>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  rec.impact === "Critical" ? "bg-[#ff5e5e]/20 text-[#ff5e5e]" : 
                  rec.impact === "High" ? "bg-[#ff9800]/20 text-[#ff9800]" : 
                  "bg-[#4caf8a]/20 text-[#4caf8a]"
                }`}>
                  {rec.impact}
                </span>
              </div>
              <p className="text-[#8a8fa8] text-xs">Confidence: {rec.confidence}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
