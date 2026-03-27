import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Database, Home as HomeIcon, Settings, BarChart2 } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/dashboard", icon: HomeIcon },
    { name: "Datasets", path: "/datasets", icon: Database },
    { name: "Dashboard", path: "/dashboards", icon: LayoutDashboard },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#16181f] border-r border-[#2a2d3a] flex flex-col h-full sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-6 mb-4">
        <div className="p-2 bg-[#6c63ff]/20 rounded-xl text-[#6c63ff]">
          <BarChart2 size={24} className="stroke-[2.5]" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Talking BI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                isActive
                  ? "bg-[#6c63ff] text-white shadow-lg shadow-[#6c63ff]/20"
                  : "text-[#8a8fa8] hover:text-white hover:bg-[#1e2029]"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
