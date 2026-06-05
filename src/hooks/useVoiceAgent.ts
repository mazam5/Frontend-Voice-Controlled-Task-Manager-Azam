import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Task } from "@/lib/api";
import { useSpeechSynthesis } from "./useSpeechSynthesis";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useVoiceAgentWebSocket } from "./useVoiceAgentWebSocket";

// ─── Types ────────────────────────────────────────────────────────────────────
export type AgentState = "idle" | "listening" | "thinking" | "speaking";

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useVoiceAgent = (onTasksUpdated?: (tasks: Task[]) => void) => {
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [interimText, setInterimText] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  // ── Stable refs to avoid stale closures in callback closures ────────────────
  const agentStateRef = useRef<AgentState>("idle");
  const onTasksUpdatedRef = useRef(onTasksUpdated);
  const isMicActiveRef = useRef(false);

  useEffect(() => {
    agentStateRef.current = agentState;
  }, [agentState]);

  useEffect(() => {
    onTasksUpdatedRef.current = onTasksUpdated;
  }, [onTasksUpdated]);

  // ── Logging ─────────────────────────────────────────────────────────────────
  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 49),
    ]);
  }, []);

  // ── TTS Hook (Text-to-Speech) ───────────────────────────────────────────────
  const {
    selectedVoice,
    setSelectedVoice,
    speakText,
  } = useSpeechSynthesis({
    onStart: () => {
      setAgentState("speaking");
    },
    onEnd: () => {
      if (agentStateRef.current === "speaking") {
        setAgentState("idle");
      }
    },
    onError: () => {
      if (agentStateRef.current === "speaking") {
        setAgentState("idle");
      }
    },
  });

  // ── WebSocket Hook ─────────────────────────────────────────────────────────
  const {
    isWsConnected,
    sendTranscriptMessage,
    sendResetMessage,
  } = useVoiceAgentWebSocket({
    addLog,
    onThinking: () => {
      setAgentState("thinking");
    },
    onResponse: (text: string, updatedTasks: Task[], logMsg?: string) => {
      setAgentState("speaking");

      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          sender: "agent",
          text,
          timestamp: new Date(),
        },
      ]);

      if (updatedTasks?.length !== undefined) {
        setTasks(updatedTasks);
        onTasksUpdatedRef.current?.(updatedTasks);
      }

      if (logMsg) addLog(logMsg);
      speakText(text);
    },
    onResetOk: () => {
      addLog("Session cleared");
    },
    onIdle: () => {
      if (agentStateRef.current === "thinking") {
        setAgentState("idle");
      }
    },
  });

  // ── Send final transcript text ───────────────────────────────────────────────
  const sendTranscript = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          sender: "user",
          text: trimmed,
          timestamp: new Date(),
        },
      ]);
      addLog(`You: "${trimmed}"`);

      const sent = sendTranscriptMessage(trimmed);
      if (sent) {
        setAgentState("thinking");
      } else {
        toast.error("Voice engine disconnected. Please wait for reconnection.");
        addLog("WS offline — transcript dropped");
      }
    },
    [addLog, sendTranscriptMessage]
  );

  // Stable ref for sendTranscript used in Speech Recognition callbacks
  const sendTranscriptRef = useRef(sendTranscript);
  useEffect(() => {
    sendTranscriptRef.current = sendTranscript;
  }, [sendTranscript]);

  // ── Speech Recognition Hook (STT) ──────────────────────────────────────────
  const {
    isMicActive,
    startListening: startRec,
    stopListening: stopRec,
  } = useSpeechRecognition({
    isAgentSpeaking: agentState === "speaking",
    onStart: () => {
      setAgentState("listening");
    },
    onResult: (interim: string, final: string) => {
      if (agentStateRef.current === "speaking" || window.speechSynthesis?.speaking) {
        setAgentState("listening");
      }

      if (interim) setInterimText(interim);

      if (final.trim()) {
        setInterimText("");
        sendTranscriptRef.current(final.trim());
      }
    },
    onSilence: () => {
      if (agentStateRef.current === "listening" && !window.speechSynthesis?.speaking) {
        setAgentState("idle");
      }
    },
    onEnd: () => {
      if (!isMicActiveRef.current) {
        setAgentState("idle");
      }
    },
    addLog,
  });

  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  // ── Initial task load ────────────────────────────────────────────────────────
  const refreshTasks = useCallback(async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
      onTasksUpdatedRef.current?.(data);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  // ── Mic toggle / controls ───────────────────────────────────────────────────
  const startListening = useCallback(() => {
    startRec();
  }, [startRec]);

  const stopListening = useCallback(() => {
    stopRec();
    setAgentState("idle");
    setInterimText("");
  }, [stopRec]);

  const toggleListening = useCallback(() => {
    if (isMicActiveRef.current) stopListening();
    else startListening();
  }, [startListening, stopListening]);

  // ── Session reset ────────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    setChatHistory([]);
    setInterimText("");
    setLogs([]);
    addLog("Session cleared");

    const sent = sendResetMessage();
    if (!sent) {
      api.resetSession().catch(console.error);
    }

    toast.success("Conversation history cleared");
  }, [addLog, sendResetMessage]);

  return {
    agentState,
    isMicActive,
    isWsConnected,
    tasks,
    chatHistory,
    interimText,
    logs,
    selectedVoice,
    setSelectedVoice,
    toggleListening,
    startListening,
    stopListening,
    resetSession,
    refreshTasks,
  };
};