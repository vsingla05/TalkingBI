import Sidebar from "../components/Sidebar";

export default function Settings() {
  return (
    <div className="min-h-screen flex bg-[#0b0c0f] text-white">
      <Sidebar />
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <p className="text-sm text-[#9aa0b4]">Manage account settings and integrations.</p>
        <div className="mt-6 p-6 bg-[#0f1115] rounded-xl border border-[#1f2228]"> 
          <p className="text-sm text-[#cdd3e9]">Update your profile, configure LLM providers, or change database settings.</p>
        </div>
      </main>
    </div>
  );
}
