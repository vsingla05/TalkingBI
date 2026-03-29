import { useState, useRef } from "react";
import { ChevronRight, Zap, BarChart3, TrendingUp, Lightbulb, Play } from "lucide-react";

export default function DashboardHub({ onSelectDashboard, charts }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const audioRef = useRef(null);

  const dashboards = [
    {
      id: "kpi",
      title: "KPI Overview",
      description: "Real-time key performance indicators and metrics at a glance",
      icon: Zap,
      gradient: "from-[#6c63ff] to-[#a78bfa]",
      accentColor: "#6c63ff",
      stats: ["4 Key Metrics", "Real-time Data", "Trend Analysis"],
      details: "Monitor your most critical business metrics with interactive visualizations and instant alerts.",
    },
    {
      id: "analytics",
      title: "Analytics Dashboard",
      description: "Comprehensive analysis and deep-dive trends",
      icon: BarChart3,
      gradient: "from-[#00bcd4] to-[#4caf8a]",
      accentColor: "#00bcd4",
      stats: ["Revenue Trends", "Growth Metrics", "Performance Data"],
      details: "Analyze patterns, compare periods, and discover actionable insights from your data.",
    },
    {
      id: "performance",
      title: "Performance Dashboard",
      description: "System health and efficiency metrics",
      icon: TrendingUp,
      gradient: "from-[#ff9800] to-[#ff5e5e]",
      accentColor: "#ff9800",
      stats: ["System Health", "Resource Usage", "Uptime Tracking"],
      details: "Monitor system performance, resource utilization, and identify optimization opportunities.",
    },
    {
      id: "insights",
      title: "Detailed Insights",
      description: "Deep-dive analysis and actionable recommendations",
      icon: Lightbulb,
      gradient: "from-[#e91e63] to-[#ff5e5e]",
      accentColor: "#e91e63",
      stats: ["Segment Analysis", "Correlations", "Recommendations"],
      details: "Uncover hidden patterns and get AI-powered recommendations for strategic decisions.",
    },
  ];

  const playDemoAudio = () => {
    const utterance = new SpeechSynthesisUtterance(
      "Welcome to the TalkingBI Dashboard Hub. Select any dashboard to explore in-depth analytics and insights with AI-powered voice narration."
    );
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-[#0e0f14] pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 px-4 md:px-8">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6c63ff]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00bcd4]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-block mb-6">
              <div className="px-4 py-2 bg-[#6c63ff]/20 rounded-full border border-[#6c63ff]/30">
                <p className="text-[#6c63ff] text-sm font-semibold">DASHBOARD COLLECTION</p>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Intelligent Business <span className="bg-gradient-to-r from-[#6c63ff] via-[#00bcd4] to-[#4caf8a] bg-clip-text text-transparent">Analytics Dashboards</span>
            </h1>

            <p className="text-lg md:text-xl text-[#8a8fa8] max-w-2xl mx-auto mb-8">
              Choose from four powerful dashboards, each designed to unlock unique insights from your data with AI-powered voice narration.
            </p>

            <button
              onClick={playDemoAudio}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#6c63ff]/30 transition-all"
            >
              <Play size={18} />
              Hear Demo Narration
            </button>
          </div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon;
              const isHovered = hoveredCard === dashboard.id;

              return (
                <div
                  key={dashboard.id}
                  onMouseEnter={() => setHoveredCard(dashboard.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => onSelectDashboard(dashboard.id)}
                  className="group cursor-pointer relative h-full"
                >
                  {/* Card */}
                  <div className={`relative overflow-hidden rounded-2xl border border-[#2a2d3a] bg-gradient-to-br from-[#1e2029] to-[#16181f] p-6 h-full transition-all duration-300 ${isHovered ? "border-opacity-100" : "border-opacity-50"}`}>
                    {/* Gradient overlay on hover */}
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${dashboard.gradient}`}
                    ></div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${dashboard.gradient} text-white transform group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={24} />
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-white mb-2">{dashboard.title}</h3>
                      <p className="text-[#8a8fa8] text-sm mb-6 line-clamp-2">{dashboard.description}</p>

                      {/* Stats */}
                      <div className="space-y-2 mb-6 flex-1">
                        {dashboard.stats.map((stat, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[#8a8fa8] text-xs">
                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${dashboard.gradient}`}></div>
                            {stat}
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2 text-white font-semibold group/btn">
                        <span>Explore</span>
                        <ChevronRight size={18} className={`transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`} />
                      </div>
                    </div>
                  </div>

                  {/* Hover effect border animation */}
                  <div
                    className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${dashboard.gradient} pointer-events-none`}
                    style={{
                      padding: "2px",
                      WebkitMaskImage: `radial-gradient(circle, transparent 30%, black 100%)`,
                      maskImage: `radial-gradient(circle, transparent 30%, black 100%)`,
                    }}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Feature highlights */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎙️",
                title: "AI Voice Narration",
                description: "Listen to AI-powered summaries of each dashboard in natural language",
              },
              {
                icon: "📊",
                title: "Real-time Analytics",
                description: "Live updates and instant insights from your uploaded datasets",
              },
              {
                icon: "🎨",
                title: "Beautiful Design",
                description: "Industry-standard UI with smooth animations and responsive layouts",
              },
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                <p className="text-[#8a8fa8] text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
