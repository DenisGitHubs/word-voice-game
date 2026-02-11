import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechRecognition({ lang = "ru-RU", onResult }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const shouldRestartRef = useRef(false);
  const langRef = useRef(lang);
  const startFnRef = useRef(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    function doStart() {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ok */
        }
        recognitionRef.current = null;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Распознавание речи не поддерживается. Используйте Chrome.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = langRef.current;
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
          if (shouldRestartRef.current) {
            setTimeout(() => {
              if (shouldRestartRef.current) startFnRef.current?.();
            }, 300);
          }
        } else {
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.onend = () => {
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current) startFnRef.current?.();
          }, 200);
        } else {
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.error("[Speech] Ошибка при start():", err);
        setIsListening(false);
      }
    }

    startFnRef.current = doStart;
  }, []);

  const startListening = useCallback(() => {
    shouldRestartRef.current = true;
    startFnRef.current?.();
  }, []);

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
