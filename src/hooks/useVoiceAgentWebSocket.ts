import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BACKEND_WS_URL, getToken } from "@/lib/api";
import type { Task } from "@/lib/api";

interface UseVoiceAgentWebSocketProps {
  addLog: (msg: string) => void;
  onThinking: () => void;
  onResponse: (text: string, updatedTasks: Task[], logMsg?: string) => void;
  onResetOk?: () => void;
  onIdle?: () => void;
}

export const useVoiceAgentWebSocket = ({
  addLog,
  onThinking,
  onResponse,
  onResetOk,
  onIdle,
}: UseVoiceAgentWebSocketProps) => {
  const [isWsConnected, setIsWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const isWsConnectedRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Keep refs up-to-date to prevent stale closures in event listeners
  useEffect(() => {
    isWsConnectedRef.current = isWsConnected;
  }, [isWsConnected]);

  const addLogRef = useRef(addLog);
  const onThinkingRef = useRef(onThinking);
  const onResponseRef = useRef(onResponse);
  const onResetOkRef = useRef(onResetOk);
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    addLogRef.current = addLog;
    onThinkingRef.current = onThinking;
    onResponseRef.current = onResponse;
    onResetOkRef.current = onResetOk;
    onIdleRef.current = onIdle;
  }, [addLog, onThinking, onResponse, onResetOk, onIdle]);

  const connectWebSocket = useCallback(() => {
    const token = getToken();
    if (!token) return;

    // Tear down existing socket cleanly
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsWsConnected(true);
      isWsConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
      ws.send(JSON.stringify({ type: "auth", token }));
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "auth_success":
            addLogRef.current("Voice engine online ✓");
            break;

          case "thinking":
            onThinkingRef.current();
            break;

          case "response":
            onResponseRef.current(data.text, data.tasks ?? [], data.log);
            break;

          case "error":
            console.error("Server error:", data.message);
            addLogRef.current(`Error: ${data.message}`);
            onIdleRef.current?.();
            toast.error(data.message);
            break;

          case "reset_ok":
            onResetOkRef.current?.();
            break;
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onerror = () => console.warn("WS error — will auto-reconnect");

    ws.onclose = (event) => {
      setIsWsConnected(false);
      isWsConnectedRef.current = false;
      wsRef.current = null;
      if (event.code === 1000) return; // deliberate close

      const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 15_000);
      reconnectAttemptsRef.current++;
      addLogRef.current(`Reconnecting in ${delay / 1000}s…`);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (getToken()) connectWebSocket();
      }, delay);
    };
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close(1000, "logout");
      wsRef.current = null;
    }
    setIsWsConnected(false);
    isWsConnectedRef.current = false;
  }, []);

  const sendTranscriptMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "transcript", text }));
      return true;
    }
    return false;
  }, []);

  const sendResetMessage = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "reset" }));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, [connectWebSocket, disconnectWebSocket]);

  return {
    isWsConnected,
    sendTranscriptMessage,
    sendResetMessage,
    connectWebSocket,
    disconnectWebSocket,
  };
};
