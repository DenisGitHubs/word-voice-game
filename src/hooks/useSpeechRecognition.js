import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechRecognition({ lang = "ru-RU", onResult }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("[Speech] API не поддерживается в этом браузере");
      alert("Распознавание речи не поддерживается. Используйте Chrome.");
      return;
    }

    // Остановить предыдущий, если есть
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ok */
      }
      recognitionRef.current = null;
    }

    console.log("[Speech] Создаю новый экземпляр...");
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log("[Speech] Слушаю...");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const alternatives = [];
      for (let i = 0; i < event.results[0].length; i++) {
        alternatives.push(event.results[0][i].transcript.toLowerCase().trim());
      }
      console.log("[Speech] Результат:", alternatives);
      onResultRef.current?.(alternatives);
    };

    recognition.onerror = (event) => {
      console.error("[Speech] Ошибка:", event.error, event.message);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      console.log("[Speech] Завершено");
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      console.log("[Speech] start() вызван");
    } catch (err) {
      console.error("[Speech] Ошибка при start():", err);
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [lang]);

  const stopListening = useCallback(() => {
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
