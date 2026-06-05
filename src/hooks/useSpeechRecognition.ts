import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UseSpeechRecognitionProps {
  onStart?: () => void;
  onResult?: (interim: string, final: string) => void;
  onSilence?: () => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  addLog?: (msg: string) => void;
  isAgentSpeaking?: boolean;
}

export const useSpeechRecognition = ({
  onStart,
  onResult,
  onSilence,
  onError,
  onEnd,
  addLog,
  isAgentSpeaking = false,
}: UseSpeechRecognitionProps = {}) => {
  const [isMicActive, setIsMicActive] = useState(false);
  const isMicActiveRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAgentSpeakingRef = useRef(isAgentSpeaking);

  useEffect(() => {
    isAgentSpeakingRef.current = isAgentSpeaking;
  }, [isAgentSpeaking]);

  // Keep refs up to date to prevent stale closures in recognition event listeners
  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  const onStartRef = useRef(onStart);
  const onResultRef = useRef(onResult);
  const onSilenceRef = useRef(onSilence);
  const onErrorRef = useRef(onError);
  const onEndRef = useRef(onEnd);
  const addLogRef = useRef(addLog);

  useEffect(() => {
    onStartRef.current = onStart;
    onResultRef.current = onResult;
    onSilenceRef.current = onSilence;
    onErrorRef.current = onError;
    onEndRef.current = onEnd;
    addLogRef.current = addLog;
  }, [onStart, onResult, onSilence, onError, onEnd, addLog]);

  // Effect to pause/resume speech recognition when agent starts/stops speaking
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isMicActive) {
      if (isAgentSpeaking) {
        console.log("⏸️ Pausing recognition (Agent is speaking)");
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn("Failed to stop recognition:", err);
        }
      } else {
        console.log("▶️ Resuming recognition (Agent stopped speaking)");
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Failed to start recognition:", err);
        }
      }
    }
  }, [isMicActive, isAgentSpeaking]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Web Speech API not supported. Please use Chrome or Edge.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      console.log("🎙️ Recognition started");
      onStartRef.current?.();
    };

    rec.onresult = (event: any) => {
      if (isAgentSpeakingRef.current) {
        console.log("Ignoring recognition result because agent is speaking");
        return;
      }

      // Interrupt any ongoing TTS immediately if user speaks (fallback barge-in)
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      onResultRef.current?.(interim, final);

      // Auto-revert to idle after 3.5 s of silence
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        onSilenceRef.current?.();
      }, 3500);
    };

    rec.onerror = (event: any) => {
      console.error("Recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow it in browser settings.");
        setIsMicActive(false);
        isMicActiveRef.current = false;
      } else if (event.error === "no-speech") {
        // Silently ignore — happens when background noise triggers the API
        console.warn("No speech detected");
      } else {
        console.warn("Recognition error:", event.error, "— will auto-restart");
      }
      onErrorRef.current?.(event.error);
    };

    rec.onend = () => {
      console.log("Recognition ended");
      onEndRef.current?.();
      // Auto-restart only if mic is supposed to be on and agent is not speaking
      if (isMicActiveRef.current && !isAgentSpeakingRef.current) {
        try {
          rec.start();
        } catch {
          /* ignore race */
        }
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition unavailable in this browser.");
      return;
    }
    // Cancel any ongoing TTS so user can immediately speak
    window.speechSynthesis?.cancel();

    setIsMicActive(true);
    isMicActiveRef.current = true;

    // Only start if agent is not speaking
    if (!isAgentSpeakingRef.current) {
      try {
        recognitionRef.current.start();
        addLogRef.current?.("🎙️ Microphone active");
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    } else {
      addLogRef.current?.("🎙️ Microphone active (paused for speaking)");
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsMicActive(false);
    isMicActiveRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    window.speechSynthesis?.cancel();
    addLogRef.current?.("🛑 Microphone off");
  }, []);

  return {
    isMicActive,
    startListening,
    stopListening,
  };
};
