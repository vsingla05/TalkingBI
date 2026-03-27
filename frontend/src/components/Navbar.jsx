import { useAuth } from "../context/AuthContext";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const { logout } = useAuth();

  return (
    <header className="h-[72px] flex-shrink-0 bg-[#0e0f14]/80 backdrop-blur-md border-b border-[#2a2d3a] flex items-center justify-end px-8 sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1e2029] flex items-center justify-center border border-[#2a2d3a]">
            <User size={16} className="text-[#8a8fa8]" />
          </div>
          <span className="text-sm font-medium text-white hidden sm:block">Agent</span>
        </div>
        <div className="w-px h-6 bg-[#2a2d3a]"></div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium text-[#8a8fa8] hover:text-[#ff5e5e] transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
