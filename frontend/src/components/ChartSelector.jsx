import { BarChart, LineChart, PieChart, TrendingUp, ScatterChart, BarChartHorizontal } from "lucide-react";

export default function ChartSelector({ selectedCharts, onToggle }) {
  const charts = [
    { id: "bar", name: "Bar Chart", icon: BarChart },
    { id: "line", name: "Line Chart", icon: LineChart },
    { id: "pie", name: "Pie Chart", icon: PieChart },
    { id: "area", name: "Area Chart", icon: TrendingUp },
    { id: "scatter", name: "Scatter Plot", icon: ScatterChart },
    { id: "histogram", name: "Histogram", icon: BarChartHorizontal },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-[#2a2d3a] scrollbar-track-transparent">
      {charts.map((chart) => {
        const isSelected = selectedCharts.includes(chart.id);
        return (
          <button
            key={chart.id}
            onClick={() => onToggle(chart.id)}
            className={`snap-start shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-200 group
              ${
                isSelected
                  ? "bg-[#6c63ff] border-[#6c63ff] text-white shadow-lg shadow-[#6c63ff]/25"
                  : "bg-[#0e0f14] border-[#2a2d3a] text-[#8a8fa8] hover:bg-[#1e2029] hover:border-[#3a3d4a] hover:text-white"
              }
            `}
          >
            <chart.icon size={20} className={isSelected ? "text-white" : "text-[#6c63ff] group-hover:text-white"} />
            <span className="font-semibold text-sm">{chart.name}</span>
          </button>
        );
      })}
    </div>
  );
}
