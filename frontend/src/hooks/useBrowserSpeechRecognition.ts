import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    [index: number]: { transcript: string };
  }>;
}

export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

export function useBrowserSpeechRecognition({
  enabled,
  language,
  onTranscript,
  onError
}: {
  enabled: boolean;
  language: string;
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const callbacks = useRef({ onTranscript, onError });
  callbacks.current = { onTranscript, onError };
  const speechWindow = window as SpeechWindow;
  const Recognition =
    speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

  const dispose = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    }
  }, []);

  const cancel = useCallback(() => {
    dispose();
    setListening(false);
  }, [dispose]);

  useEffect(() => {
    if (!enabled) cancel();
    return dispose;
  }, [enabled, cancel, dispose]);

  const toggle = useCallback(() => {
    if (!enabled || !Recognition) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = false;
    const delivered = new Set<number>();
    recognition.onresult = (event) => {
      const transcripts: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && !delivered.has(i)) {
          delivered.add(i);
          transcripts.push(result[0].transcript.trim());
        }
      }
      const transcript = transcripts.filter(Boolean).join(' ');
      if (transcript) callbacks.current.onTranscript(transcript);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      setListening(false);
    };
    recognition.onerror = (event) => {
      cancel();
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        callbacks.current.onError(event.error);
      }
    };
    try {
      setListening(true);
      recognition.start();
    } catch (error) {
      cancel();
      callbacks.current.onError(
        error instanceof Error ? error.message : 'unknown'
      );
    }
  }, [enabled, Recognition, language, cancel]);

  return { supported: !!Recognition, listening, toggle, cancel };
}
