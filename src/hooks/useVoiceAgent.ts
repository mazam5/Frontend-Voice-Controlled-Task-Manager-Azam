import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Task } from "@/lib/api";
import { useSpeechSynthesis } from "./useSpeechSynthesis";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useVoiceAgentWebSocket } from "./useVoiceAgentWebSocket";

export type AgentState = "idle" | "listening" | "thinking" | "speaking";

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
}

export const useVoiceAgent = (onTasksUpdated?: (tasks: Task[]) => void) => {
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [interimText, setInterimText] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const agentStateRef = useRef<AgentState>("idle");
  const onTasksUpdatedRef = useRef(onTasksUpdated);
  const isMicActiveRef = useRef(false);
  const isAutoListeningRef = useRef(false);

  useEffect(() => {
    agentStateRef.current = agentState;
  }, [agentState]);

  useEffect(() => {
    onTasksUpdatedRef.current = onTasksUpdated;
  }, [onTasksUpdated]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 49),
    ]);
  }, []);

  // TTS Hook (Text-to-Speech)
  const {
    selectedVoice,
    setSelectedVoice,
    speakText,
    cancelSpeech,
  } = useSpeechSynthesis({
    onStart: () => {
      setAgentState("speaking");
    },
    onEnd: () => {
      const wasSpeaking = agentStateRef.current === "speaking";
      setAgentState("idle");
      if (wasSpeaking && isAutoListeningRef.current) {
        setTimeout(() => {
          if (agentStateRef.current === "idle") {
            startListening();
          }
        }, 400);
      }
    },
    onError: () => {
      const wasSpeaking = agentStateRef.current === "speaking";
      setAgentState("idle");
      if (wasSpeaking && isAutoListeningRef.current) {
        setTimeout(() => {
          if (agentStateRef.current === "idle") {
            startListening();
          }
        }, 400);
      }
    },
  });

  // WebSocket Hook (keeps session connection alive)
  const {
    isWsConnected,
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

  // Manual transcription helper (available as fallback)
  const sendTranscript = useCallback(
    async (text: string) => {
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
      setAgentState("thinking");
    },
    [addLog]
  );

  // Audio Speech Recording Hook (transcribes locally captured webm Blobs via backend REST upload)
  const {
    isMicActive,
    startListening: startRec,
    stopListening: stopRec,
  } = useSpeechRecognition({
    onStart: () => {
      setAgentState("listening");
      setInterimText("");
    },
    onInterimText: (text) => {
      setInterimText(text);
    },
    onStop: async (audioBlob: Blob) => {
      setAgentState("thinking");
      setInterimText("");
      addLog("Uploading audio file for transcription & processing...");

      try {
        const result = await api.uploadAudio(audioBlob);

        // Add user transcript to chat log
        if (result.transcript) {
          setChatHistory((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).slice(2),
              sender: "user",
              text: result.transcript,
              timestamp: new Date(),
            },
          ]);
          addLog(`You: "${result.transcript}"`);
        }

        // Add agent response to chat and speak
        if (result.textResponse) {
          setAgentState("speaking");
          setChatHistory((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).slice(2),
              sender: "agent",
              text: result.textResponse,
              timestamp: new Date(),
            },
          ]);
          if (result.log) addLog(result.log);
          speakText(result.textResponse);
        } else {
          setAgentState("idle");
        }

        // Synchronize tasks list
        if (result.tasks) {
          setTasks(result.tasks);
          onTasksUpdatedRef.current?.(result.tasks);
        }
      } catch (err: any) {
        console.error("Voice processing error:", err);
        addLog(`Error: ${err.message}`);
        setAgentState("idle");
        toast.error("Voice processing failed: " + err.message);
      }
    },
    onError: (error) => {
      addLog(`Mic error: ${error}`);
      setAgentState("idle");
      setInterimText("");
    },
    addLog,
  });

  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  // Initial tasks refresh
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

  const startListening = useCallback(() => {
    isAutoListeningRef.current = true;
    startRec();
  }, [startRec]);

  const stopListening = useCallback(() => {
    isAutoListeningRef.current = false;
    stopRec();
    setAgentState("idle");
    setInterimText("");
  }, [stopRec]);

  const toggleListening = useCallback(() => {
    if (agentStateRef.current === "speaking") {
      isAutoListeningRef.current = false;
      cancelSpeech();
      setAgentState("idle");
    } else if (isMicActiveRef.current || agentStateRef.current === "listening") {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening, cancelSpeech]);

  const resetSession = useCallback(() => {
    setChatHistory([]);
    setInterimText("");
    setLogs([]);
    addLog("Session cleared");

    sendResetMessage();
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
    sendTranscript,
  };
};