import { Mic, MicOff, Terminal } from "lucide-react";
import type { AgentState } from "@/hooks/useVoiceAgent";

interface VoiceOrbPanelProps {
  agentState: AgentState;
  isMicActive: boolean;
  toggleListening: () => void;
  logs: string[];
}

export const VoiceOrbPanel = ({
  agentState,
  isMicActive,
  toggleListening,
  logs,
}: VoiceOrbPanelProps) => {
  return (
    <div
      className="flex-[0.9] flex flex-col glass-panel rounded-2xl p-6 justify-center items-center relative overflow-hidden h-full min-h-[380px] md:min-h-0"
    >
      <div className="flex flex-col items-center justify-center my-auto z-10 gap-6">
        <button
          onClick={toggleListening}
          className="relative focus:outline-none group select-none cursor-pointer"
          title="Click to toggle voice assistant"
        >
          <div
            className={`absolute inset-0 rounded-full blur-xl opacity-60 transition-all duration-700 ${
              agentState === "listening"
                ? "bg-pink-500 scale-125"
                : agentState === "thinking"
                ? "bg-emerald-500 scale-110"
                : agentState === "speaking"
                ? "bg-purple-500 scale-120"
                : "bg-indigo-600 scale-100 group-hover:scale-105"
            }`}
          />
          <div
            className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 bg-linear-to-br ${
              agentState === "listening"
                ? "from-pink-500 via-rose-500 to-indigo-600 animate-orb-listening"
                : agentState === "thinking"
                ? "from-emerald-400 via-teal-500 to-blue-600 animate-orb-thinking"
                : agentState === "speaking"
                ? "from-purple-500 via-indigo-500 to-pink-500 animate-orb-speaking"
                : "from-indigo-600 via-purple-600 to-slate-950 animate-orb-breath border border-indigo-400/20"
            }`}
          >
            <div className="bg-slate-950/80 p-5 rounded-full border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
              {isMicActive ? (
                <Mic className="w-8 h-8 md:w-10 md:h-10 text-pink-400 animate-pulse" />
              ) : (
                <MicOff className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />
              )}
            </div>
          </div>
        </button>

        <div className="text-center">
          <h3 className="font-extrabold text-lg tracking-wide capitalize bg-clip-text text-transparent bg-linear-to-r from-slate-100 to-slate-300">
            {agentState === "idle" ? "Ready to Listen" : `${agentState}...`}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-48 mx-auto">
            {agentState === "idle" && "Click orb to start listening"}
            {agentState === "listening" && "Go ahead, speak to me!"}
            {agentState === "thinking" && "Processing request..."}
            {agentState === "speaking" && "Responding via voice"}
          </p>
        </div>

        {(agentState === "listening" || agentState === "speaking") && (
          <div className="flex items-center justify-center gap-1.5 h-10 mt-2">
            {[0.1, 0.3, 0.5, 0.2, 0.4].map((delay, i) => (
              <div
                key={i}
                className={`w-1 rounded-full animate-wave-bar ${
                  i % 2 === 0
                    ? "bg-pink-500"
                    : i === 2
                    ? "bg-indigo-500"
                    : "bg-purple-500"
                }`}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-full mt-auto glass-card p-3 rounded-xl border border-slate-900 text-left shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 border-b border-slate-900 pb-1">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Agent Operations Log</span>
        </div>
        <div className="h-16 overflow-y-auto text-[10px] font-mono text-indigo-300/80 custom-scrollbar flex flex-col gap-1">
          {logs.length === 0 ? (
            <span className="text-slate-600 italic">No logs yet...</span>
          ) : (
            logs.map((log, i) => <span key={i}>{log}</span>)
          )}
        </div>
      </div>
    </div>
  );
};
