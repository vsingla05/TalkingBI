import { useState, useRef } from "react";
import { Send, Mic, Loader } from "lucide-react";
import api from "../api/client";

export default function QuestionBox({ onQuestionAnswered, selectedCharts = ["bar", "line", "pie"] }) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Speech recognition not supported in your browser");
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setQuestion((prev) => prev + transcript);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognition.onerror = (event) => {
      setError(`Speech error: ${event.error}`);
      setIsListening(false);
    };

    return recognition;
  };

  // Start Voice Input
  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  // Stop Voice Input
  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Submit Question
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/ask-question", {
        question: question.trim(),
        requested_charts: selectedCharts,
      });

      if (response.data) {
        setQuestion("");
        onQuestionAnswered(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail?.message || "Failed to process question");
      console.error("Question error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Question Input Box */}
      <div className="bg-gradient-to-br from-[#1e2029] to-[#16181f] border border-[#2a2d3a] rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Ask a Follow-up Question</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the data... (e.g., 'Show revenue by region')"
              className="flex-1 px-4 py-3 bg-[#0e0f14] border border-[#2a2d3a] rounded-xl text-white placeholder-[#8a8fa8] focus:outline-none focus:border-[#6c63ff] transition-all"
              disabled={isLoading || isListening}
            />

            {/* Voice Button */}
            <button
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={isLoading}
              className={`p-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                isListening
                  ? "bg-[#ff5e5e] text-white hover:bg-[#ff4040]"
                  : "bg-[#4caf8a] text-white hover:bg-[#3d9371]"
              } disabled:opacity-50`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              <Mic size={18} />
              {isListening && <span className="text-xs animate-pulse">Listening...</span>}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-[#6c63ff]/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Ask
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-[#ff5e5e]/10 border border-[#ff5e5e]/30 text-[#ff5e5e] rounded-lg text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Listening State */}
          {isListening && (
            <div className="p-3 bg-[#4caf8a]/10 border border-[#4caf8a]/30 text-[#4caf8a] rounded-lg text-sm font-medium flex items-center gap-2">
              🎤 Listening... Speak your question now
            </div>
          )}

          {/* Current Question Preview */}
          {question && (
            <div className="p-3 bg-[#6c63ff]/10 border border-[#6c63ff]/30 text-[#6c63ff] rounded-lg text-sm">
              <strong>Your question:</strong> {question}
            </div>
          )}
        </form>
      </div>

      {/* Tips */}
      <div className="text-xs text-[#8a8fa8] space-y-1">
        <p>💡 <strong>Tip:</strong> Ask specific questions like "Show me sales by region" or "Which category is most profitable?"</p>
        <p>🎤 <strong>Voice:</strong> Click the microphone button to ask questions by voice</p>
      </div>
    </div>
  );
}
