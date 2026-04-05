import { useState, useRef, useEffect } from "react";
import api from "../api/client";

import DashboardHub from "./DashboardHub";
import DynamicDashboard from "./DynamicDashboard";
import KPIDashboard from "./dashboards/KPIDashboard";
import AnalyticsDashboard from "./dashboards/AnalyticsDashboard";
import PerformanceDashboard from "./dashboards/PerformanceDashboard";
import InsightsDashboard from "./dashboards/InsightsDashboard";
import FollowUpQuestionBox from "./FollowUpQuestionBox";
import ChartRenderer from "./ChartRenderer";

export default function DashboardView({ charts = [], datasetId, dynamicDashboards = null }) {
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [currentSummaryText, setCurrentSummaryText] = useState("");
  const [dynamicChartData, setDynamicChartData] = useState(null);
  const [dynamicChartTitle, setDynamicChartTitle] = useState("");
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  const handleSelectDashboard = (dashboardId) => {
    setSelectedDashboard(dashboardId);
    setDynamicChartData(null); // Clear previous dynamic chart
  };

  const handleBackToHub = () => {
    setSelectedDashboard(null);
    setDynamicChartData(null);
    // Stop any playing audio
    if (audioRef.current) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  // Handle new charts from follow-up questions
  const handleQuestionAnswered = (newChartData) => {
    setDynamicChartData(newChartData);
    setDynamicChartTitle(newChartData.title || "Answer to Your Question");
  };

  const handleVoiceSummary = async (dashboardType, dashboardData) => {
    try {
      // For now, we'll use Web Speech API for text-to-speech
      // In production, this could use a TTS service like Google Cloud TTS or ElevenLabs

      const summaryPrompt = buildSummaryText(dashboardType, dashboardData);
      setCurrentSummaryText(summaryPrompt);

      // Use Web Speech API
      const utterance = new SpeechSynthesisUtterance(summaryPrompt);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsPlayingAudio(true);
        setIsPausedAudio(false);
      };
      utterance.onend = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      };
      utterance.onpause = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(true);
      };
      utterance.onresume = () => {
        setIsPlayingAudio(true);
        setIsPausedAudio(false);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      };

      // Store utterance reference for pause/resume
      utteranceRef.current = utterance;

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error generating voice summary:", error);
    }
  };

  // Pause audio
  const handlePauseAudio = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlayingAudio(false);
      setIsPausedAudio(true);
    }
  };

  // Resume audio
  const handleResumeAudio = () => {
    if (isPausedAudio && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
    }
  };

  // Stop audio
  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
  };

  const buildSummaryText = (dashboardType, data) => {
    switch (dashboardType) {
      case "kpi":
        return buildKPISummary(data);
      case "analytics":
        return buildAnalyticsSummary(data);
      case "performance":
        return buildPerformanceSummary(data);
      case "insights":
        return buildInsightsSummary(data);
      default:
        return "Dashboard summary";
    }
  };

  const buildKPISummary = (data) => {
    let text = "Key Performance Indicators Dashboard Summary. ";
    if (data.kpis && data.kpis.length > 0) {
      text += `We have ${data.kpis.length} main metrics. `;
      data.kpis.slice(0, 3).forEach((kpi) => {
        text += `${kpi.label} is currently ${kpi.value} with a ${kpi.change} change. `;
      });
    }
    if (data.insights && data.insights.length > 0) {
      text += "Key insights: ";
      data.insights.forEach((insight) => {
        text += `${insight.text}. `;
      });
    }
    return text;
  };

  const buildAnalyticsSummary = (data) => {
    let text = "Analytics Dashboard Summary. ";
    if (data.charts && data.charts.length > 0) {
      text += `This dashboard contains ${data.charts.length} analytical charts. `;
    }
    if (data.insights && data.insights.length > 0) {
      text += "Major findings: ";
      data.insights.forEach((insight) => {
        text += `${insight.text}. `;
      });
    }
    return text;
  };

  const buildPerformanceSummary = (data) => {
    let text = "Performance Dashboard Summary. ";
    if (data.kpis && data.kpis.length > 0) {
      text += `Current performance metrics: `;
      data.kpis.slice(0, 4).forEach((kpi) => {
        text += `${kpi.label} at ${kpi.value}, `;
      });
      text += ". ";
    }
    if (data.insights && data.insights.length > 0) {
      text += "Performance insights: ";
      data.insights.forEach((insight) => {
        text += `${insight.text}. `;
      });
    }
    return text;
  };

  const buildInsightsSummary = (data) => {
    let text = "Detailed Insights Dashboard Summary. ";
    if (data.insights && data.insights.length > 0) {
      text += `We have identified ${data.insights.length} key insights. `;
      data.insights.slice(0, 5).forEach((insight) => {
        text += `${insight.text}. `;
      });
    }
    return text;
  };

  // Render selected dashboard
  if (selectedDashboard === "kpi") {
    return (
      <div>
        <DashboardHeader onBack={handleBackToHub} title="KPI Overview" />
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <KPIDashboard 
            charts={charts} 
            onVoiceSummary={handleVoiceSummary} 
            isPlayingAudio={isPlayingAudio}
            isPausedAudio={isPausedAudio}
            onPauseAudio={handlePauseAudio}
            onResumeAudio={handleResumeAudio}
            onStopAudio={handleStopAudio}
          />
          <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
            <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
          </div>
          {dynamicChartData && (
            <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
              <h3 className="text-xl font-bold text-white mb-4">{dynamicChartTitle}</h3>
              <ChartRenderer chartData={dynamicChartData} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedDashboard === "analytics") {
    return (
      <div>
        <DashboardHeader onBack={handleBackToHub} title="Analytics Dashboard" />
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <AnalyticsDashboard 
            charts={charts} 
            onVoiceSummary={handleVoiceSummary} 
            isPlayingAudio={isPlayingAudio}
            isPausedAudio={isPausedAudio}
            onPauseAudio={handlePauseAudio}
            onResumeAudio={handleResumeAudio}
            onStopAudio={handleStopAudio}
          />
          <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
            <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
          </div>
          {dynamicChartData && (
            <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
              <h3 className="text-xl font-bold text-white mb-4">{dynamicChartTitle}</h3>
              <ChartRenderer chartData={dynamicChartData} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedDashboard === "performance") {
    return (
      <div>
        <DashboardHeader onBack={handleBackToHub} title="Performance Dashboard" />
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <PerformanceDashboard 
            charts={charts} 
            onVoiceSummary={handleVoiceSummary} 
            isPlayingAudio={isPlayingAudio}
            isPausedAudio={isPausedAudio}
            onPauseAudio={handlePauseAudio}
            onResumeAudio={handleResumeAudio}
            onStopAudio={handleStopAudio}
          />
          <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
            <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
          </div>
          {dynamicChartData && (
            <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
              <h3 className="text-xl font-bold text-white mb-4">{dynamicChartTitle}</h3>
              <ChartRenderer chartData={dynamicChartData} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedDashboard === "insights") {
    return (
      <div>
        <DashboardHeader onBack={handleBackToHub} title="Detailed Insights" />
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <InsightsDashboard 
            charts={charts} 
            onVoiceSummary={handleVoiceSummary} 
            isPlayingAudio={isPlayingAudio}
            isPausedAudio={isPausedAudio}
            onPauseAudio={handlePauseAudio}
            onResumeAudio={handleResumeAudio}
            onStopAudio={handleStopAudio}
          />
          <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
            <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
          </div>
          {dynamicChartData && (
            <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
              <h3 className="text-xl font-bold text-white mb-4">{dynamicChartTitle}</h3>
              <ChartRenderer chartData={dynamicChartData} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: Show 4 dynamic dashboards if available, otherwise show dashboard hub
  if (dynamicDashboards) {
    // Check which dashboard is selected
    const dashboardTypes = ["kpi_dashboard", "analytics_dashboard", "performance_dashboard", "insights_dashboard"];
    const dashboardLabels = {
      kpi_dashboard: "KPI Overview",
      analytics_dashboard: "Analytics Dashboard",
      performance_dashboard: "Performance Dashboard",
      insights_dashboard: "Detailed Insights"
    };
    
    // If a specific dashboard is selected, show it
    if (selectedDashboard) {
      const selectedData = dynamicDashboards[selectedDashboard];
      
      if (!selectedData) {
        return (
          <div className="flex flex-col h-screen bg-[#0e0f14]">
            <DashboardHeader onBack={handleBackToHub} title={dashboardLabels[selectedDashboard] || "Dashboard"} />
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[#8a8fa8]">Dashboard data is loading...</p>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex flex-col h-screen bg-[#0e0f14]">
          <DashboardHeader onBack={handleBackToHub} title={dashboardLabels[selectedDashboard] || "Dashboard"} />
          <div className="flex-1 overflow-auto bg-[#0e0f14]">
              {selectedDashboard === "kpi_dashboard" && (
                <KPIDashboard 
                  charts={[]}
                  dashboardData={selectedData}
                  onVoiceSummary={handleVoiceSummary}
                  isPlayingAudio={isPlayingAudio}
                  isPausedAudio={isPausedAudio}
                  onPauseAudio={handlePauseAudio}
                  onResumeAudio={handleResumeAudio}
                  onStopAudio={handleStopAudio}
                />
              )}
              {selectedDashboard === "analytics_dashboard" && (
                <AnalyticsDashboard 
                  charts={[]}
                  dashboardData={selectedData}
                  onVoiceSummary={handleVoiceSummary}
                  isPlayingAudio={isPlayingAudio}
                  isPausedAudio={isPausedAudio}
                  onPauseAudio={handlePauseAudio}
                  onResumeAudio={handleResumeAudio}
                  onStopAudio={handleStopAudio}
                />
              )}
              {selectedDashboard === "performance_dashboard" && (
                <PerformanceDashboard 
                  charts={[]}
                  dashboardData={selectedData}
                  onVoiceSummary={handleVoiceSummary}
                  isPlayingAudio={isPlayingAudio}
                  isPausedAudio={isPausedAudio}
                  onPauseAudio={handlePauseAudio}
                  onResumeAudio={handleResumeAudio}
                  onStopAudio={handleStopAudio}
                />
              )}
              {selectedDashboard === "insights_dashboard" && (
                <InsightsDashboard 
                  charts={[]}
                  dashboardData={selectedData}
                  onVoiceSummary={handleVoiceSummary}
                  isPlayingAudio={isPlayingAudio}
                  isPausedAudio={isPausedAudio}
                  onPauseAudio={handlePauseAudio}
                  onResumeAudio={handleResumeAudio}
                  onStopAudio={handleStopAudio}
                />
              )}
              <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
                <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
              </div>
            </div>
          </div>
        );
      }
    
    // Show dashboard hub with 4 dashboards
    if (!dynamicDashboards) {
      return (
        <div className="w-full min-h-screen bg-[#0e0f14] p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#8a8fa8] text-lg">No dashboards available. Please run a query first.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full min-h-screen bg-[#0e0f14] p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">📊 Dynamic Dashboards</h2>
          <p className="text-[#8a8fa8] text-lg mb-12">Select a dashboard to explore your data</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboardTypes.map((dashboardType) => {
              const dashboardData = dynamicDashboards[dashboardType];
              if (!dashboardData) return null;
              
              const icons = {
                kpi_dashboard: "📈",
                analytics_dashboard: "📊",
                performance_dashboard: "⚡",
                insights_dashboard: "💡"
              };
              
              return (
                <button
                  key={dashboardType}
                  onClick={() => setSelectedDashboard(dashboardType)}
                  className="group relative overflow-hidden rounded-xl border border-[#2a2d3a] bg-gradient-to-br from-[#1a1d2e] to-[#0e0f14] p-6 hover:border-[#3a3d4a] transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{icons[dashboardType]}</span>
                      <h3 className="text-xl font-bold text-white">{dashboardLabels[dashboardType]}</h3>
                    </div>
                    <p className="text-[#8a8fa8] text-sm mb-4">{dashboardData.insight || "Click to view"}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6a6f8a]">
                        {dashboardData.kpis?.length || 0} KPIs • {dashboardData.charts?.length || 0} Charts
                      </span>
                      <span className="text-white text-lg group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <DashboardHub onSelectDashboard={handleSelectDashboard} charts={charts} />;
}

function DashboardHeader({ onBack, title }) {
  return (
    <div className="bg-[#0e0f14] border-b border-[#2a2d3a] sticky top-0 z-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#1e2029] rounded-lg transition-colors text-[#8a8fa8] hover:text-white"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold text-white">← Back to Dashboard Hub</h2>
      </div>
    </div>
  );
}
