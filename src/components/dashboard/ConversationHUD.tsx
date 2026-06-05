import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Volume2 } from "lucide-react";
import type { ChatMessage } from "@/hooks/useVoiceAgent";

interface ConversationHUDProps {
  chatHistory: ChatMessage[];
  interimText: string;
  isWsConnected: boolean;
  resetSession: () => void;
  mobileTab: "orb" | "chat" | "agenda";
}

export const ConversationHUD = ({
  chatHistory,
  interimText,
  isWsConnected,
  resetSession,
  mobileTab,
}: ConversationHUDProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, interimText]);

  return (
    <div
      className={`flex-1 flex flex-col glass-panel rounded-2xl p-4 overflow-hidden h-full ${
        mobileTab === "chat" ? "flex" : "hidden"
      } md:flex`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
        <div>
          <h2 className="font-bold text-base text-slate-200">Conversation HUD</h2>
          <p className="text-[10px] text-slate-400">Live Voice Transcript</p>
        </div>
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetSession}
            title="Reset Conversation"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 w-8 h-8 rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Volume2 className="w-8 h-8 mb-2 opacity-30 animate-bounce" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs max-w-xs mt-1">
              Click the orb to speak, or type a command below — e.g.{" "}
              <em>"Create a task for tomorrow at 8 AM"</em>
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === "user"
                  ? "self-end items-end"
                  : "self-start items-start"
              }`}
            >
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender === "user"
                    ? "bg-linear-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none"
                    : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {msg.sender === "user" ? "You" : "AuraAssistant"} •{" "}
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}

        {interimText && (
          <div className="flex flex-col max-w-[85%] self-end items-end animate-pulse">
            <div className="px-4 py-2.5 rounded-2xl text-sm bg-indigo-600/30 text-indigo-200 border border-indigo-500/20 rounded-tr-none">
              {interimText}...
            </div>
            <span className="text-[10px] text-indigo-400/70 mt-1 px-1">
              Speaking...
            </span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-slate-900 pt-3 mt-3 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isWsConnected
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-amber-500 animate-pulse"
            }`}
          />
          <span>
            {isWsConnected ? "Connected" : "Offline (HTTP Fallback)"}
          </span>
        </div>
        <span className="font-semibold text-slate-400">
          Auralist Voice Engine
        </span>
      </div>
    </div>
  );
};
