/**
 * Voice input hook using MediaRecorder API
 * Sends audio blob to /api/ai/transcribe (OpenRouter Whisper) for STT
 * Fallback to Web Speech API on browsers that don't support MediaRecorder well
 */
import { useState, useRef, useCallback } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

interface UseVoiceInputOptions {
  onResult: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoiceInput({ onResult, onError }: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startListening = useCallback(async () => {
    if (state === 'listening') return;

    // Try Web Speech API first (instant, no server roundtrip)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setState('listening');
      recognition.onend = () => setState('idle');
      recognition.onerror = () => {
        setState('idle');
        onError?.('ไม่สามารถรับเสียงได้ กรุณาลองใหม่');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript ?? '';
        if (transcript) onResult(transcript);
        setState('idle');
      };

      recognition.start();
      return;
    }

    // Fallback: MediaRecorder → send to /api/ai/transcribe (Whisper)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState('processing');
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');

          const response = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error(`Server error: ${response.status}`);
          const data = await response.json();
          if (data.text) {
            onResult(data.text);
          } else {
            throw new Error('No transcription returned');
          }
        } catch (err: any) {
          console.error('Transcription error:', err);
          onError?.(err.message ?? 'การถอดเสียงล้มเหลว');
        } finally {
          setState('idle');
        }
      };

      mediaRecorder.start();
      setState('listening');
    } catch (err: any) {
      console.error('Mic error:', err);
      setState('error');
      onError?.('ไม่สามารถเข้าถึงไมค์ได้ กรุณาอนุญาตการใช้งานไมโครโฟน');
    }
  }, [state, onResult, onError]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    // Web Speech API stops automatically
  }, []);

  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      stopListening();
    } else if (state === 'idle') {
      startListening();
    }
  }, [state, startListening, stopListening]);

  return { state, toggleListening, startListening, stopListening };
}
