import { useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

/**
 * DashboardDemo Component
 * Standalone demo for testing all 4 dashboards without backend dependency
 */

const mockCharts = [
  {
    title: "Monthly Revenue",
    type: "line",
    xAxis: "month",
    yAxis: "revenue",
    data: [
      { month: "Jan", revenue: 120000 },
      { month: "Feb", revenue: 145000 },
      { month: "Mar", revenue: 165000 },
      { month: "Apr", revenue: 150000 },
      { month: "May", revenue: 180000 },
      { month: "Jun", revenue: 210000 },
    ],
  },
  {
    title: "Sales by Region",
    type: "bar",
    xAxis: "region",
    yAxis: "sales",
    data: [
      { region: "North", sales: 50000 },
      { region: "South", sales: 45000 },
      { region: "East", sales: 65000 },
      { region: "West", sales: 55000 },
    ],
  },
  {
    title: "Customer Growth",
    type: "area",
    xAxis: "week",
    yAxis: "users",
    data: [
      { week: "Week 1", users: 1000 },
      { week: "Week 2", users: 1200 },
      { week: "Week 3", users: 1450 },
      { week: "Week 4", users: 1800 },
    ],
  },
];

export default function DashboardDemo() {
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const dashboards = [
    {
      id: "kpi",
      name: "KPI Overview",
      description: "Real-time key metrics and performance indicators",
      icon: "📊",
    },
    {
      id: "analytics",
      name: "Analytics Dashboard",
      description: "Comprehensive trend analysis and comparisons",
      icon: "📈",
    },
    {
      id: "performance",
      name: "Performance Dashboard",
      description: "System health and efficiency monitoring",
      icon: "⚙️",
    },
    {
      id: "insights",
      name: "Detailed Insights",
      description: "Strategic insights and recommendations",
      icon: "💡",
    },
  ];

  const playVoiceDemo = () => {
    const text = "This is a demo of the TalkingBI voice narration system. Click any dashboard to explore all features.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
  };

  if (activeDashboard) {
    return (
      <div className="min-h-screen bg-[#0e0f14] p-8">
        <button
          onClick={() => setActiveDashboard(null)}
          className="mb-6 px-4 py-2 bg-[#1e2029] hover:bg-[#2a2d3a] text-white rounded-lg transition-colors"
        >
          ← Back
        </button>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">
            {dashboards.find((d) => d.id === activeDashboard)?.name}
          </h1>

          <button
            onClick={playVoiceDemo}
            disabled={isPlaying}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 mb-8"
          >
            {isPlaying ? (
              <>
                <Pause size={18} />
                Stop Voice Brief
              </>
            ) : (
              <>
                <Play size={18} />
                Play Voice Narration
              </>
            )}
          </button>

          <div className="bg-[#16181f] border border-[#2a2d3a] rounded-2xl p-8">
            <p className="text-[#8a8fa8] text-center py-12">
              This is a demo view of the {activeDashboard} dashboard.
              <br />
              In production, this would display:
            </p>
            <ul className="text-[#8a8fa8] text-center space-y-2">
              <li>✓ Real-time data visualizations</li>
              <li>✓ Interactive charts with Recharts</li>
              <li>✓ KPI cards and metrics</li>
              <li>✓ AI-powered insights</li>
              <li>✓ Voice-narrated summaries</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0f14] to-[#16181f]">
      {/* Header */}
      <div className="px-8 py-16 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          🎙️ TalkingBI Dashboard Demo
        </h1>
        <p className="text-xl text-[#8a8fa8] mb-8">
          Explore our four premium business intelligence dashboards
        </p>
        <button
          onClick={playVoiceDemo}
          disabled={isPlaying}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
        >
          {isPlaying ? (
            <>
              <Pause size={18} />
              Stop Demo Voice
            </>
          ) : (
            <>
              <Play size={18} />
              Hear Demo Narration
            </>
          )}
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-6xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboards.map((dashboard) => (
            <button
              key={dashboard.id}
              onClick={() => setActiveDashboard(dashboard.id)}
              className="group bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6 hover:border-[#6c63ff]/50 hover:shadow-lg hover:shadow-[#6c63ff]/20 transition-all hover:-translate-y-2 text-left"
            >
              <div className="text-4xl mb-4">{dashboard.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">
                {dashboard.name}
              </h3>
              <p className="text-[#8a8fa8] text-sm mb-4">
                {dashboard.description}
              </p>
              <div className="text-xs text-[#6c63ff] font-semibold group-hover:text-white transition-colors">
                Explore →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-[#16181f]/50 border-t border-[#2a2d3a] px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            ✨ Premium Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "🎙️ AI Voice",
                desc: "Listen to AI-narrated summaries",
              },
              {
                title: "📊 4 Dashboards",
                desc: "KPI, Analytics, Performance, Insights",
              },
              {
                title: "🎨 Beautiful UI",
                desc: "Premium design with animations",
              },
              {
                title: "📱 Responsive",
                desc: "Perfect on mobile, tablet, desktop",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-[#1e2029] border border-[#2a2d3a] rounded-xl p-4 text-center"
              >
                <p className="text-2xl mb-2">{feature.title}</p>
                <p className="text-[#8a8fa8] text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#0e0f14] border-t border-[#2a2d3a] px-8 py-8 text-center text-[#8a8fa8]">
        <p>Built with ❤️ for modern business intelligence</p>
        <p className="text-sm mt-2">
          Ready to analyze your data? Upload a CSV file to get started!
        </p>
      </div>
    </div>
  );
}
