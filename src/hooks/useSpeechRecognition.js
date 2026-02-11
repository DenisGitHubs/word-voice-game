import { useCallback, useEffect, useRef, useState } from "react";

// Запрашиваем разрешение на микрофон один раз через getUserMedia,
// чтобы SpeechRecognition не спрашивал повторно на мобильных
let micPermissionGranted = false;
export async function ensureMicPermission() {
  if (micPermissionGranted) return true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    micPermissionGranted = true;
    return true;
  } catch {
    return false;
  }
}

export function useSpeechRecognition({ lang = "ru-RU", onResult }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const shouldRestartRef = useRef(false);
  const restartTimerRef = useRef(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const doStart = useCallback(() => {
    // Очищаем pending restart
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      // Переиспользуем существующий экземпляр
      try {
        recognitionRef.current.start();
      } catch {
        /* уже запущен */
      }
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (!last.isFinal) return;
      const alternatives = [];
      for (let i = 0; i < last.length; i++) {
        alternatives.push(last[i].transcript.toLowerCase().trim());
      }
      onResultRef.current?.(alternatives);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setIsListening(false);
        recognitionRef.current = null;
        return;
      }
      // no-speech, aborted, network — перезапустим в onend
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        // Перезапускаем тот же экземпляр
        restartTimerRef.current = setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              /* ok */
            }
          }
        }, 250);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* ok */
    }
  }, [lang]);

  const startListening = useCallback(async () => {
    const ok = await ensureMicPermission();
    if (!ok) {
      alert("Разрешите доступ к микрофону для голосового ввода.");
      return;
    }
    shouldRestartRef.current = true;
    doStart();
  }, [doStart]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ok */
      }
    }
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
}
