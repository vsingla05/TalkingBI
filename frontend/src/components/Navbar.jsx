import { useAuth } from "../context/AuthContext";
import { LogOut, User, Bell, Settings, Sparkles } from "lucide-react";

export default function Navbar() {
  const { logout } = useAuth();

  return (
    <header className="h-[72px] flex-shrink-0 bg-gradient-to-r from-[#0e0f14]/95 via-[#0e0f14]/95 to-[#0e0f14]/95 backdrop-blur-xl border-b border-[#2a2d3a] flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg">
      {/* Left Section - Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#6c63ff]/10 border border-[#6c63ff]/20 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#4caf8a] animate-pulse"></div>
          <span className="text-xs font-bold text-[#6c63ff] uppercase tracking-wide">System Active</span>
        </div>
      </div>

      {/* Right Section - User Controls */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-[#1e2029] rounded-lg transition-colors text-[#8a8fa8] hover:text-white group">
          <Bell size={18} />
          <div className="absolute top-1 right-1 w-2 h-2 bg-[#ff5e5e] rounded-full animate-pulse"></div>
          <span className="absolute top-0 right-0 w-5 h-5 text-xs font-bold text-white bg-[#ff5e5e] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-y-1 -translate-x-1 transition-all">2</span>
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-[#1e2029] rounded-lg transition-colors text-[#8a8fa8] hover:text-white">
          <Settings size={18} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[#2a2d3a]"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center border border-[#6c63ff]/30 shadow-lg shadow-[#6c63ff]/20">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-semibold text-white leading-tight">Agent</span>
            <span className="text-xs text-[#8a8fa8]">AI Assistant</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-semibold text-[#8a8fa8] hover:text-[#ff5e5e] hover:bg-[#1e2029] px-3 py-2 rounded-lg transition-all"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
