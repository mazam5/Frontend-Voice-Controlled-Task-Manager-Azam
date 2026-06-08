import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface UseAudioRecorderProps {
  onStart?: () => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: string) => void;
  addLog?: (msg: string) => void;
  onInterimText?: (text: string) => void;
}

export const useSpeechRecognition = ({
  onStart,
  onStop,
  onError,
  addLog,
  onInterimText,
}: UseAudioRecorderProps = {}) => {
  const [isMicActive, setIsMicActive] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Web Audio API refs for silence detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  // Stop recording and cleanup audio resources
  const stopListening = useCallback(() => {
    // Clear silence monitoring interval
    if (analyserIntervalRef.current) {
      clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // Stop browser SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch { }
      recognitionRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      console.log("🎙️ Stopping voice recording (microphone deactivated)");
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !navigator.mediaDevices) {
        throw new Error("Media devices not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mime type
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/ogg" };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "" }; // default browser type
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log("🎙️ Voice is recording: MediaRecorder started");
        setIsMicActive(true);
        addLog?.("🎙️ Microphone active — recording...");
        onStart?.();

        // Try to initialize browser speech recognition for real-time HUD updates
        try {
          const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognitionClass) {
            const rec = new SpeechRecognitionClass();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = "en-US";

            rec.onresult = (event: any) => {
              let interim = "";
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                interim += event.results[i][0].transcript;
              }
              onInterimText?.(interim);
            };

            rec.onerror = (e: any) => {
              // Quietly log real-time errors without affecting standard audio recording
              console.log("🎙️ Real-time speech preview info:", e.error);
            };

            rec.start();
            recognitionRef.current = rec;
          }
        } catch (recErr) {
          console.warn("Real-time speech recognition preview not available:", recErr);
        }

        // Initialize Web Audio API for volume-based silence detection
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextClass();
          audioContextRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 512;
          analyserRef.current = analyser;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          let silenceDurationMs = 0;
          const SILENCE_THRESHOLD = 0.015; // Volume levels below this are considered silence
          const AUTO_STOP_SILENCE_MS = 2000; // Auto stop after 2 seconds of silence

          analyserIntervalRef.current = setInterval(() => {
            if (!analyserRef.current) return;

            analyserRef.current.getByteTimeDomainData(dataArray);

            // Calculate Root Mean Square (RMS) volume level
            let sumSquares = 0;
            for (let i = 0; i < bufferLength; i++) {
              const normalizedValue = (dataArray[i] - 128) / 128;
              sumSquares += normalizedValue * normalizedValue;
            }
            const rmsVolume = Math.sqrt(sumSquares / bufferLength);


            if (rmsVolume < SILENCE_THRESHOLD) {
              silenceDurationMs += 100;
              if (silenceDurationMs >= AUTO_STOP_SILENCE_MS) {
                stopListening();
              }
            } else {
              silenceDurationMs = 0; // User is speaking, reset silence timer
            }
          }, 100);
        } catch (audioErr) {
          console.warn("Failed to initialize silence auto-detection:", audioErr);
        }
      };

      mediaRecorder.onstop = () => {
        setIsMicActive(false);
        addLog?.("🛑 Microphone off — processing audio...");

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        onStop?.(audioBlob);

        // Stop all audio tracks to release the mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(250); // collect data every 250ms chunks
    } catch (err: any) {
      console.error("Failed to start voice recording:", err);
      toast.error("Microphone access failed: " + err.message);
      onError?.(err.message);
      setIsMicActive(false);
    }
  }, [onStart, onStop, onError, addLog, stopListening]);

  return {
    isMicActive,
    startListening,
    stopListening,
  };
};
