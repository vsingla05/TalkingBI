import { TrendingUp, TrendingDown } from "lucide-react";

export default function KPICard({ title, value, subValue, trend, icon: Icon, colorClass }) {
  // trend > 0 = positive, trend < 0 = negative, string = neutral or uncalculated
  const isPositive = typeof trend === "number" ? trend >= 0 : null;

  return (
    <div className="bg-[#16181f]/80 backdrop-blur-xl border border-[#2a2d3a] p-6 rounded-3xl flex flex-col justify-between hover:border-[#6c63ff]/40 transition-all duration-300 group shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3.5 rounded-2xl ${colorClass} bg-opacity-10 shadow-inner`}>
          <Icon size={24} className="opacity-90 group-hover:opacity-100 transition-opacity" />
        </div>
        {isPositive !== null && (
          <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${isPositive ? "bg-[#4caf8a]/15 text-[#4caf8a]" : "bg-[#ff5e5e]/15 text-[#ff5e5e]"}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h4 className="text-[#8a8fa8] text-sm font-semibold mb-2 uppercase tracking-widest">{title}</h4>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
          {subValue && <span className="text-sm font-medium text-[#8a8fa8]">{subValue}</span>}
        </div>
      </div>
    </div>
  );
}
