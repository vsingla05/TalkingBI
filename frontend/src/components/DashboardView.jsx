import { useState, useRef, useEffect } from "react";
import api from "../api/client";

import DashboardHub from "./DashboardHub";
import KPIDashboard from "./dashboards/KPIDashboard";
import AnalyticsDashboard from "./dashboards/AnalyticsDashboard";
import PerformanceDashboard from "./dashboards/PerformanceDashboard";
import InsightsDashboard from "./dashboards/InsightsDashboard";
import FollowUpQuestionBox from "./FollowUpQuestionBox";

export default function DashboardView({ charts = [], datasetId }) {
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSummaryText, setCurrentSummaryText] = useState("");
  const [dynamicChartData, setDynamicChartData] = useState(null);
  const [dynamicChartTitle, setDynamicChartTitle] = useState("");
  const audioRef = useRef(null);

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

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);

      // Alternative: Call backend API for TTS (if implemented)
      // const response = await api.post("/dashboard-voice-summary", {
      //   dashboard_type: dashboardType,
      //   dashboard_data: dashboardData,
      // });
      // if (response.data.summary_text) {
      //   const utterance = new SpeechSynthesisUtterance(response.data.summary_text);
      //   window.speechSynthesis.speak(utterance);
      // }
    } catch (error) {
      console.error("Error generating voice summary:", error);
    }
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
          <KPIDashboard charts={charts} onVoiceSummary={handleVoiceSummary} isPlayingAudio={isPlayingAudio} onStopAudio={() => setIsPlayingAudio(false)} />
          <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
            <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
          </div>
        </div>
      </div>
    );
  }

  if (selectedDashboard === "analytics") {
    return (
      <div>
        <DashboardHeader onBack={handleBackToHub} title="Analytics Dashboard" />
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <AnalyticsDashboard charts={charts} onVoiceSummary={handleVoiceSummary} isPlayingAudio={isPlayingAudio} onStopAudio={() => setIsPlayingAudio(false)} />
          <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
            <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
          </div>
        </div>
      </div>
    );
  }

  if (selectedDashboard === "performance") {
    return (
      <div>
        <DashboardHeader onBack={handleBackToHub} title="Performance Dashboard" />
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <PerformanceDashboard charts={charts} onVoiceSummary={handleVoiceSummary} isPlayingAudio={isPlayingAudio} onStopAudio={() => setIsPlayingAudio(false)} />
          <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
            <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
          </div>
        </div>
      </div>
    );
  }

  if (selectedDashboard === "insights") {
    return (
      <div>
        <DashboardHeader onBack={handleBackToHub} title="Detailed Insights" />
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <InsightsDashboard charts={charts} onVoiceSummary={handleVoiceSummary} isPlayingAudio={isPlayingAudio} onStopAudio={() => setIsPlayingAudio(false)} />
          <div className="px-6 py-6 bg-[#0e0f14] border-t border-[#2a2d3a]">
            <FollowUpQuestionBox datasetId={datasetId} onQuestionAnswered={handleQuestionAnswered} />
          </div>
        </div>
      </div>
    );
  }

  // Default: Show dashboard hub
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
