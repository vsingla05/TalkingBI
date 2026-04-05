import { useState } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const COLORS = ["#6c63ff", "#00bcd4", "#4caf8a", "#ff9800", "#f44336", "#9c27b0"];

export default function ComparisonDashboard({ comparisons = [] }) {
  const [expandedCard, setExpandedCard] = useState(null);

  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#0e0f14] p-8">
        <div className="text-center">
          <p className="text-[#8a8fa8] text-lg">No comparisons available</p>
        </div>
      </div>
    );
  }

  // Group cards by type
  const metricCards = comparisons.filter(c => c.card_type === "metric");
  const chartCards = comparisons.filter(c => c.card_type === "chart");
  const topPerformers = comparisons.filter(c => c.card_type === "top_performers");

  return (
    <div className="w-full min-h-screen bg-[#0e0f14] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Smart Comparisons & Insights</h1>
          <p className="text-[#8a8fa8] text-lg">
            Automatically discovered relationships and metrics from your data
          </p>
        </div>

        {/* METRIC CARDS SECTION */}
        {metricCards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Key Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {metricCards.map((card, idx) => (
                <MetricCard key={idx} card={card} />
              ))}
            </div>
          </div>
        )}

        {/* COMPARISON CHARTS SECTION */}
        {chartCards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Comparisons & Relationships</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartCards.map((card, idx) => (
                <ChartCard key={idx} card={card} />
              ))}
            </div>
          </div>
        )}

        {/* TOP PERFORMERS SECTION */}
        {topPerformers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">🏆 Top Performers</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {topPerformers.map((card, idx) => (
                <TopPerformersCard key={idx} card={card} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ card }) {
  const { title, value, unit, icon, metric_type } = card;

  // Format value based on type
  const formattedValue = formatValue(value, metric_type);

  return (
    <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6 hover:border-[#3a3d4a] transition-all duration-300 hover:shadow-lg cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#8a8fa8] uppercase tracking-wide">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-white">
          {formattedValue}
          {unit && <span className="text-lg text-[#8a8fa8] ml-2">{unit}</span>}
        </p>
      </div>

      <div className="text-xs text-[#6a6f8a]">
        {metric_type === "total" && "Total value across all records"}
        {metric_type === "average" && "Average value per record"}
        {metric_type === "max" && "Maximum value found"}
        {metric_type === "min" && "Minimum value found"}
      </div>
    </div>
  );
}

function ChartCard({ card }) {
  const { title, chart_type, data, x_axis, y_axis } = card;

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6 flex items-center justify-center h-96">
        <p className="text-[#8a8fa8]">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chart_type === "bar" && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey={y_axis} fill="#6c63ff" radius={[8, 8, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          )}

          {chart_type === "line" && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px" }} />
              <Legend />
              <Line type="monotone" dataKey={y_axis} stroke="#00bcd4" strokeWidth={3} />
            </LineChart>
          )}

          {chart_type === "area" && (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px" }} />
              <Legend />
              <Area type="monotone" dataKey={y_axis} stroke="#4caf8a" fill="#4caf8a" fillOpacity={0.3} />
            </AreaChart>
          )}

          {chart_type === "scatter" && (
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis type="number" dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis type="number" dataKey={y_axis} stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px" }} />
              <Scatter name="Data" data={data} fill="#ff9800" />
            </ScatterChart>
          )}

          {chart_type === "pie" && (
            <PieChart>
              <Pie data={data} dataKey={y_axis} nameKey={x_axis} cx="50%" cy="50%" outerRadius={100} label>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px" }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopPerformersCard({ card }) {
  const { title, data, chart_type } = card;

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <p className="text-[#8a8fa8]">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>

      {/* Mini bar chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis dataKey={Object.keys(data[0]?.[0] || {})[0]} stroke="#8a8fa8" />
            <YAxis stroke="#8a8fa8" />
            <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px" }} />
            <Bar dataKey={Object.keys(data[0]?.[0] || {})[1]} fill="#6c63ff" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* List view */}
      <div className="space-y-2">
        {data.slice(0, 5).map((item, idx) => {
          const keys = Object.keys(item);
          const name = item[keys[0]];
          const value = item[keys[1]];

          return (
            <div key={idx} className="flex items-center justify-between p-3 bg-[#0e0f14] rounded-lg hover:bg-[#16181f] transition">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm text-white">{name}</span>
              </div>
              <span className="text-sm font-semibold text-[#00bcd4]">{formatValue(value, "value")}</span>
            </div>
          );
        })}
      </div>

      {data.length > 5 && <p className="text-xs text-[#6a6f8a] mt-4">+{data.length - 5} more</p>}
    </div>
  );
}

// Utility function to format values
function formatValue(value, type) {
  if (value === null || value === undefined) return "N/A";

  const num = parseFloat(value);
  if (isNaN(num)) return value;

  if (type === "total" || type === "revenue" || type === "profit") {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  }

  if (type === "average") {
    return `${num.toFixed(2)}`;
  }

  if (type === "percentage") {
    return `${num.toFixed(1)}%`;
  }

  if (num > 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num > 1000) return `${(num / 1000).toFixed(2)}K`;

  return num.toFixed(num === Math.floor(num) ? 0 : 2);
}
