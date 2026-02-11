import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechRecognition({ lang = "ru-RU", onResult }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Распознавание речи не поддерживается. Используйте Chrome.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

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
      if (event.error === "no-speech" || event.error === "aborted") {
        // Тихо перезапускаем тот же экземпляр
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                /* уже запущен */
              }
            }
          }, 300);
        }
      } else if (event.error === "not-allowed") {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      // Перезапускаем тот же экземпляр без создания нового
      if (shouldRestartRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              /* уже запущен */
            }
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [lang]);

  const startListening = useCallback(() => {
    shouldRestartRef.current = true;
    const recognition = ensureRecognition();
    if (!recognition) return;
    try {
      recognition.start();
    } catch {
      // Уже запущен — ок
    }
  }, [ensureRecognition]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ok */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
}
