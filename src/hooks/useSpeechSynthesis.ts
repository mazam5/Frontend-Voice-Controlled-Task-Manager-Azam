import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechSynthesisProps {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export const useSpeechSynthesis = ({
  onStart,
  onEnd,
  onError,
}: UseSpeechSynthesisProps = {}) => {
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const selectedVoiceRef = useRef(selectedVoice);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  // Stable callbacks using refs to avoid stale closures and unnecessary rerenders
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onStartRef.current = onStart;
    onEndRef.current = onEnd;
    onErrorRef.current = onError;
  }, [onStart, onEnd, onError]);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleaned = text.replace(/[*_`#•]/g, "").trim();
    if (!cleaned) return;

    const utt = new SpeechSynthesisUtterance(cleaned);

    // Apply selected voice
    if (selectedVoiceRef.current) {
      const voice = window.speechSynthesis
        .getVoices()
        .find((v) => v.name === selectedVoiceRef.current);
      if (voice) utt.voice = voice;
    }
    utt.rate = 1.0;
    utt.pitch = 1.0;

    utt.onstart = () => {
      onStartRef.current?.();
    };

    utt.onend = () => {
      onEndRef.current?.();
    };

    utt.onerror = (e) => {
      console.error("TTS error:", e);
      onErrorRef.current?.(e);
    };

    window.speechSynthesis.speak(utt);
  }, []);

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return {
    selectedVoice,
    setSelectedVoice,
    speakText,
    cancelSpeech,
  };
};
