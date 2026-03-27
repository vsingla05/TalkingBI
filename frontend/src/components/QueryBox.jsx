import { useSpeechToText } from "../hooks/useSpeechToText";
import { Mic, MicOff, Sparkles, AlertCircle } from "lucide-react";

export default function QueryBox({ query, setQuery, onAnalyze, loading, disabled }) {
  const { isListening, error, startListening, stopListening } = useSpeechToText((text) => setQuery(text));

  const handleMicToggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const isFormValid = query.trim() && !loading && !disabled;

  return (
    <div className="w-full flex flex-col gap-4 group relative">
      {/* Premium Floating Status Indicator */}
      <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-[#0e0f14] px-4 py-2 rounded-2xl border border-[#2a2d3a] shadow-2xl transition-all duration-500 z-20 ${
        isListening ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-1 h-3 rounded-full bg-[#ff5e5e] animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <span className="text-[0.7rem] font-black text-[#ff5e5e] uppercase tracking-[0.2em]">Voice Active</span>
      </div>

      {/* Senior Engineer Command Bar UI */}
      <div className="relative flex items-center bg-[#0a0b10] border border-[#2a2d3a] rounded-[1.5rem] p-2 transition-all duration-500 focus-within:border-[#6c63ff] focus-within:ring-4 focus-within:ring-[#6c63ff]/5 focus-within:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        
        {/* Futuristic Mic Toggle */}
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={loading}
          className={`relative p-4 rounded-2xl border transition-all duration-500 group/mic active:scale-90 ${
            isListening 
              ? "bg-[#ff5e5e]/10 border-[#ff5e5e]/40 text-[#ff5e5e] shadow-[0_0_20px_rgba(255,94,94,0.15)]" 
              : "bg-[#16181f] border-[#2a2d3a] text-[#8a8fa8] hover:border-[#6c63ff]/40 hover:text-white"
          }`}
          title={isListening ? "Stop listening" : "Start Voice Query"}
        >
          <div className={`absolute inset-0 bg-[#ff5e5e] transition-opacity duration-500 rounded-2xl ${isListening ? "opacity-10 blur-xl animate-pulse" : "opacity-0"}`} />
          {isListening ? (
            <MicOff size={24} className="relative z-10" />
          ) : (
            <Mic size={24} className="relative z-10 group-hover/mic:scale-110 transition-transform duration-300" />
          )}
        </button>

        {/* The Master Input Field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isListening ? "Speak now..." : "Analyze revenue by region for last quarter..."}
          className="flex-1 bg-transparent border-none text-[1.2rem] text-white px-6 outline-none placeholder:text-[#8a8fa8]/30 font-semibold tracking-tight"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isFormValid) onAnalyze();
          }}
        />

        {/* Action Button */}
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!isFormValid}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all duration-500 text-xs uppercase tracking-[0.1em] ${
            isFormValid
              ? "bg-[#6c63ff] shadow-[0_10px_30px_rgba(108,99,255,0.3)] text-white hover:shadow-[0_15px_40px_rgba(108,99,255,0.5)] hover:-translate-y-0.5 active:translate-y-0"
              : "bg-[#16181f] text-[#8a8fa8]/40 border border-[#2a2d3a] cursor-not-allowed opacity-60"
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={16} />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Intelligent Feedback Layer */}
      <div className="h-4 px-2">
        {error ? (
          <div className="flex items-center gap-2 text-[#ff5e5e] text-[0.65rem] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">
            <AlertCircle size={12} />
            {error === 'not-allowed' ? "Microphone access denied" : "Speech processing unavailable"}
          </div>
        ) : isListening ? (
          <div className="flex items-center gap-2 text-[#6c63ff] text-[0.65rem] font-bold uppercase tracking-widest animate-pulse opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6c63ff]" />
            Capturing Audio...
          </div>
        ) : null}
      </div>
    </div>
  );
}
