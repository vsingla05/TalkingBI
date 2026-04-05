import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { Volume2, Pause, RotateCcw, X } from "lucide-react";

const COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#06B6D4", "#6366F1", "#F43F5E",
];

const chartTypeMap = {
  line: LineChart,
  bar: BarChart,
  area: AreaChart,
  pie: PieChart,
  scatter: ScatterChart,
};

const chartComponentMap = {
  line: Line,
  bar: Bar,
  area: Area,
  pie: Pie,
  scatter: Scatter,
};

export default function DynamicDashboard({
  dashboardData,
  onVoiceSummary,
  isPlayingAudio,
  isPausedAudio,
  onPauseAudio,
  onResumeAudio,
  onStopAudio,
}) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setIsPaused(isPausedAudio);
  }, [isPausedAudio]);

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0e0f14]">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No Dashboard Available</h3>
          <p className="text-[#8a8fa8]">Please run a query to generate a dashboard</p>
        </div>
      </div>
    );
  }

  const { title, insight, kpis = [], charts = [] } = dashboardData;

  const toggleVoiceSummary = () => {
    if (!isPlayingAudio && !isPaused) {
      // Start playing
      onVoiceSummary("dynamic", dashboardData);
    } else if (isPlayingAudio && !isPaused) {
      // Pause
      onPauseAudio();
      setIsPaused(true);
    } else if (isPaused) {
      // Resume
      onResumeAudio();
      setIsPaused(false);
    }
  };

  const buttonText = !isPlayingAudio && !isPaused 
    ? "Hear Summary" 
    : isPlayingAudio && !isPaused 
    ? "Pause" 
    : "Resume";

  const buttonColor = !isPlayingAudio && !isPaused 
    ? "bg-blue-500 hover:bg-blue-600" 
    : isPlayingAudio && !isPaused 
    ? "bg-orange-500 hover:bg-orange-600" 
    : "bg-green-500 hover:bg-green-600";

  const renderChart = (chartSpec, index) => {
    const { type, title: chartTitle, x_axis, y_axis, data } = chartSpec;
    
    if (!data || data.length === 0) {
      return (
        <div key={index} className="bg-[#1a1d2e] rounded-lg p-6 border border-[#2a2d3a]">
          <h3 className="text-lg font-semibold text-white mb-4">{chartTitle}</h3>
          <div className="flex items-center justify-center h-64 text-[#8a8fa8]">
            No data available for this chart
          </div>
        </div>
      );
    }

    const ChartComponent = chartTypeMap[type] || BarChart;
    const DataComponent = chartComponentMap[type] || Bar;

    return (
      <div key={index} className="bg-[#1a1d2e] rounded-lg p-6 border border-[#2a2d3a]">
        <h3 className="text-lg font-semibold text-white mb-4">{chartTitle}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            {type !== "pie" && (
              <>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey={x_axis} stroke="#8a8fa8" />
                <YAxis stroke="#8a8fa8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1a1d2e", border: "1px solid #2a2d3a" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
              </>
            )}
            {type === "pie" ? (
              <Pie
                data={data}
                dataKey={y_axis}
                nameKey={x_axis}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            ) : (
              <DataComponent dataKey={y_axis} stroke={COLORS[0]} fill={COLORS[0]} />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0e0f14] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          {insight && (
            <p className="text-[#a0a5b8] text-lg leading-relaxed">{insight}</p>
          )}
        </div>

        {/* Voice Control Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={toggleVoiceSummary}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${buttonColor}`}
          >
            {!isPlayingAudio && !isPaused ? (
              <>
                <Volume2 size={18} />
                {buttonText}
              </>
            ) : isPlayingAudio && !isPaused ? (
              <>
                <Pause size={18} />
                {buttonText}
              </>
            ) : (
              <>
                <RotateCcw size={18} />
                {buttonText}
              </>
            )}
          </button>

          {(isPlayingAudio || isPaused) && (
            <button
              onClick={onStopAudio}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              <X size={18} />
              Stop
            </button>
          )}
        </div>

        {/* KPIs Section */}
        {kpis.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Key Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-[#1a1d2e] to-[#0e0f14] border border-[#2a2d3a] rounded-lg p-6 hover:border-[#3a3d4a] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[#8a8fa8] text-sm font-medium">{kpi.label}</p>
                      <p className="text-2xl font-bold text-white mt-2">
                        {kpi.value}
                        {kpi.unit && <span className="text-lg ml-1">{kpi.unit}</span>}
                      </p>
                    </div>
                    {kpi.change && (
                      <div className={`text-sm font-semibold ${
                        kpi.change.startsWith("+") ? "text-green-400" : "text-red-400"
                      }`}>
                        {kpi.change}
                      </div>
                    )}
                  </div>
                  {kpi.description && (
                    <p className="text-xs text-[#6a6f8a] mt-4">{kpi.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Section */}
        {charts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Visualizations</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart, index) => renderChart(chart, index))}
            </div>
          </div>
        )}

        {!charts.length && !kpis.length && (
          <div className="text-center text-[#8a8fa8] py-12">
            <p>No data available to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
