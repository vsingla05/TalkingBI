import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Database, Home as HomeIcon, Settings, BarChart2, TrendingUp } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Datasets", path: "/datasets", icon: Database },
    { name: "Analytics", path: "/dashboards", icon: TrendingUp },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-[#16181f] to-[#0e0f14] border-r border-[#2a2d3a] flex flex-col h-full sticky top-0 shadow-2xl">
      {/* Logo Section */}
      <div className="px-6 pt-8 pb-8 mb-2 relative">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="p-2.5 bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] rounded-xl text-white shadow-lg shadow-[#6c63ff]/30 group-hover:shadow-[#6c63ff]/50 transition-all">
            <BarChart2 size={24} className="stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <span className="text-lg font-bold text-white tracking-tight block">Talking BI</span>
            <span className="text-xs text-[#8a8fa8] font-medium">Business Intelligence</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="px-4 mb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#2a2d3a] to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm group relative overflow-hidden ${
                isActive
                  ? "bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] text-white shadow-lg shadow-[#6c63ff]/20"
                  : "text-[#8a8fa8] hover:text-white hover:bg-[#1e2029]/80"
              }`}
            >
              {/* Hover glow effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#6c63ff]/0 to-[#a78bfa]/0 group-hover:from-[#6c63ff]/10 group-hover:to-[#a78bfa]/10 transition-all"></div>
              )}
              <item.icon size={18} className="relative z-10" />
              <span className="relative z-10">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-lg shadow-white/50"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="px-4 py-6 border-t border-[#2a2d3a] space-y-4">
        <div className="bg-gradient-to-r from-[#6c63ff]/10 to-[#a78bfa]/10 border border-[#6c63ff]/20 rounded-xl p-3 text-center">
          <p className="text-xs text-[#8a8fa8] mb-2 font-semibold uppercase tracking-wide">Feature Status</p>
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-[#4caf8a] rounded-full animate-pulse"></span>
            <span className="text-xs text-[#f0f0f5] font-bold">Live & Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
