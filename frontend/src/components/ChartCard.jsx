export default function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`bg-[#16181f] border border-[#2a2d3a] rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col transition-all duration-300 hover:border-[#6c63ff]/50 hover:shadow-[#6c63ff]/10 ${className}`}>
      <h3 className="text-[1.05rem] font-semibold text-white mb-4 flex items-center gap-2 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6c63ff]" />
        {title}
      </h3>
      <div className="flex-1 w-full min-h-[220px]">
        {children}
      </div>
    </div>
  );
}
