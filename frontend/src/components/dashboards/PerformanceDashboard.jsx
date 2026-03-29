import React, { useState, useRef, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Loader, Play, Square } from "lucide-react";

const COLORS = ["#ff9800", "#ff5e5e", "#4caf8a", "#6c63ff"];

export default function PerformanceDashboard({ charts, onVoiceSummary, isPlayingAudio = false, onStopAudio }) {
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync isPlaying with parent isPlayingAudio prop
  useEffect(() => {
    setIsPlaying(isPlayingAudio);
  }, [isPlayingAudio]);

  // Mock data
  const cpuData = [
    { time: "00:00", cpu: 25, memory: 45, disk: 65 },
    { time: "04:00", cpu: 35, memory: 50, disk: 70 },
    { time: "08:00", cpu: 55, memory: 65, disk: 78 },
    { time: "12:00", cpu: 45, memory: 60, disk: 75 },
    { time: "16:00", cpu: 65, memory: 75, disk: 82 },
    { time: "20:00", cpu: 55, memory: 70, disk: 80 },
  ];

  const uptimeData = [
    { day: "Mon", uptime: 99.9, target: 99.95 },
    { day: "Tue", uptime: 99.85, target: 99.95 },
    { day: "Wed", uptime: 99.95, target: 99.95 },
    { day: "Thu", uptime: 99.9, target: 99.95 },
    { day: "Fri", uptime: 99.88, target: 99.95 },
    { day: "Sat", uptime: 99.92, target: 99.95 },
  ];

  const responseTimeData = [
    { endpoint: "API V1", time: 120, threshold: 150 },
    { endpoint: "API V2", time: 95, threshold: 150 },
    { endpoint: "API V3", time: 110, threshold: 150 },
    { endpoint: "Web", time: 200, threshold: 250 },
    { endpoint: "Mobile", time: 140, threshold: 200 },
  ];

  const throughputData = [
    { hour: "Hour 1", requests: 4000, errors: 120 },
    { hour: "Hour 2", requests: 3000, errors: 98 },
    { hour: "Hour 3", requests: 2000, errors: 45 },
    { hour: "Hour 4", requests: 2780, errors: 56 },
    { hour: "Hour 5", requests: 1890, errors: 23 },
    { hour: "Hour 6", requests: 2390, errors: 34 },
  ];

  const handleVoiceSummary = async () => {
    setIsGeneratingVoice(true);
    setIsPlaying(true);
    try {
      const dashboardData = {
        charts: charts,
        insights: [
          { text: "System performance stable with average CPU utilization at 48 percent" },
          { text: "Uptime maintained above 99.8 percent throughout the monitoring period" },
          { text: "API response times averaging 113 milliseconds, well within acceptable limits" },
          { text: "Error rate reduced to 0.8 percent, indicating improved system reliability" },
        ],
      };
      await onVoiceSummary("performance", dashboardData);
    } finally {
      setIsGeneratingVoice(false);
      setIsPlaying(false);
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
          <h1 className="text-3xl md:text-4xl font-bold text-white">Performance Dashboard</h1>
          <p className="text-[#8a8fa8] mt-2">System health and efficiency metrics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleVoiceSummary}
            disabled={isGeneratingVoice}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              isPlaying
                ? "bg-[#ff5e5e] hover:bg-[#ff4040]"
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

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg CPU Usage", value: "48%", change: "-5%", positive: true },
          { label: "Memory Usage", value: "62%", change: "+2%", positive: false },
          { label: "Uptime", value: "99.9%", change: "+0.1%", positive: true },
          { label: "Error Rate", value: "0.8%", change: "-0.3%", positive: true },
        ].map((metric, idx) => (
          <div key={idx} className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
            <p className="text-[#8a8fa8] text-sm font-medium mb-2">{metric.label}</p>
            <p className="text-2xl md:text-3xl font-bold text-white mb-3">{metric.value}</p>
            <div className={`text-sm font-semibold ${metric.positive ? "text-[#4caf8a]" : "text-[#ff5e5e]"}`}>
              {metric.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">System Resources</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">CPU, Memory, and Disk Usage</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="time" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="#ff9800" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="memory" stroke="#6c63ff" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="disk" stroke="#ff5e5e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime Trend */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Uptime Performance</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Daily uptime vs target</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uptimeData}>
                <defs>
                  <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4caf8a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4caf8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="day" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" domain={[99.8, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Area type="monotone" dataKey="uptime" fill="url(#colorUptime)" stroke="#4caf8a" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="#ff5e5e" strokeDasharray="5 5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">API Response Times</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Milliseconds by endpoint</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="endpoint" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Bar dataKey="time" fill="#6c63ff" radius={[8, 8, 0, 0]} />
                <Bar dataKey="threshold" fill="#ff5e5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Request Throughput */}
        <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Request Throughput</h3>
            <p className="text-[#8a8fa8] text-sm mt-1">Requests and errors per hour</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="hour" stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
                <Legend />
                <Bar dataKey="requests" fill="#00bcd4" radius={[8, 8, 0, 0]} />
                <Bar dataKey="errors" fill="#ff5e5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
