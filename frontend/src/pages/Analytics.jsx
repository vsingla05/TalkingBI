import Sidebar from "../components/Sidebar";

export default function Analytics() {
  return (
    <div className="min-h-screen flex bg-[#0b0c0f] text-white">
      <Sidebar />
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold mb-4">Analytics</h1>
        <p className="text-sm text-[#9aa0b4]">Explore saved analyses and run custom analytics.</p>
        <div className="mt-6 p-6 bg-[#0f1115] rounded-xl border border-[#1f2228]"> 
          <p className="text-sm text-[#cdd3e9]">Select an analysis to view its dashboard or generate a new one using the AI tools.</p>
        </div>
      </main>
    </div>
  );
}
