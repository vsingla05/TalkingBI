import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, ScatterChart, Scatter } from "recharts";

const COLORS = ["#6c63ff", "#00bcd4", "#4caf8a", "#ff9800", "#f44336", "#9c27b0", "#2196f3", "#00bcd4", "#009688", "#ffeb3b"];

export default function ChartRenderer({ chartData }) {
  if (!chartData) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl">
        <p className="text-[#8a8fa8]">No chart data available</p>
      </div>
    );
  }

  const { type = "bar", title, data, x_axis, y_axis } = chartData;

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl">
        <p className="text-[#8a8fa8]">No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6">
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {(type === "bar" || !type) && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
              <Legend />
              <Bar dataKey={y_axis} fill="#6c63ff" radius={[8, 8, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          )}
          {type === "line" && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
              <Legend />
              <Line type="monotone" dataKey={y_axis} stroke="#00bcd4" strokeWidth={3} dot={{ fill: "#00bcd4", r: 5 }} />
            </LineChart>
          )}
          {type === "area" && (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
              <Legend />
              <Area type="monotone" dataKey={y_axis} stroke="#4caf8a" fill="#4caf8a" fillOpacity={0.3} />
            </AreaChart>
          )}
          {type === "pie" && (
            <PieChart>
              <Pie data={data} dataKey={y_axis} nameKey={x_axis} cx="50%" cy="50%" outerRadius={100} label>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
              <Legend />
            </PieChart>
          )}
          {type === "scatter" && (
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis type="number" dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis type="number" dataKey={y_axis} stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
              <Scatter name="Data" data={data} fill="#ff9800" />
            </ScatterChart>
          )}
          {type === "histogram" && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey={x_axis} stroke="#8a8fa8" />
              <YAxis stroke="#8a8fa8" />
              <Tooltip contentStyle={{ backgroundColor: "#16181f", border: "1px solid #2a2d3a", borderRadius: "8px", color: "#f0f0f5" }} />
              <Legend />
              <Bar dataKey={y_axis} fill="#a78bfa" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
