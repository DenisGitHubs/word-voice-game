import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";
import { getShuffledWords } from "../data/words";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import {
    playCountdown,
    playFail,
    playGameOver,
    playStart,
    playStreak,
    playSuccess,
    vibrate,
} from "../utils/sounds";

const GAME_DURATION = 60;
const WORDS_PER_ROUND = 30;

/* ── inline style objects (Tailwind-independent) ── */
const S = {
  page: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(180deg, #0a0a1a 0%, #10103a 40%, #180a30 70%, #0a0a1a 100%)",
    color: "#fff",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  pagePlaying: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(180deg, #0a0a1a 0%, #10103a 40%, #180a30 70%, #0a0a1a 100%)",
    color: "#fff",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  center: { textAlign: "center" },
  bigEmoji: { fontSize: "clamp(56px, 15vw, 90px)", marginBottom: 16 },
  title: {
    fontSize: "clamp(36px, 10vw, 56px)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    margin: "0 0 8px",
    background: "linear-gradient(135deg, #a78bfa, #818cf8, #6366f1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "clamp(16px, 4vw, 20px)",
    color: "#9ca3af",
    margin: "0 0 4px",
  },
  desc: {
    fontSize: "clamp(13px, 3vw, 15px)",
    color: "#6b7280",
    margin: "0 0 40px",
    maxWidth: 300,
    lineHeight: 1.5,
  },
  btn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    padding: "clamp(16px, 4vw, 22px) clamp(36px, 10vw, 56px)",
    fontSize: "clamp(18px, 4.5vw, 22px)",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 0 30px rgba(99,102,241,0.4), 0 4px 20px rgba(0,0,0,0.3)",
    transition: "transform 0.15s, box-shadow 0.3s",
    fontFamily: "inherit",
    WebkitTapHighlightColor: "transparent",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    fontSize: "clamp(12px, 3vw, 14px)",
    color: "#6b7280",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  countdownNum: {
    fontSize: "clamp(100px, 25vw, 160px)",
    fontWeight: 900,
    textShadow: "0 0 60px rgba(99,102,241,0.6)",
  },
  // Top bar
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "clamp(12px,3vw,20px) clamp(16px,4vw,24px) 8px",
    position: "relative",
    zIndex: 10,
    fontSize: "clamp(18px, 5vw, 26px)",
    fontWeight: 800,
  },
  progressOuter: {
    margin: "0 clamp(16px,4vw,24px)",
    height: 6,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #a855f7)",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },
  // Word area
  wordArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: "0 clamp(16px,4vw,32px)",
  },
  wordEmoji: { fontSize: "clamp(48px, 14vw, 80px)", marginBottom: 12 },
  wordText: {
    fontSize: "clamp(40px, 12vw, 72px)",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  wordHint: {
    fontSize: "clamp(14px, 3.5vw, 18px)",
    color: "#6b7280",
    marginTop: 12,
  },
  wordNum: {
    fontSize: "clamp(12px, 3vw, 14px)",
    color: "#6b7280",
    marginBottom: 8,
  },
  // Feedback
  feedbackBox: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "22%",
    display: "flex",
    justifyContent: "center",
    zIndex: 20,
  },
  feedbackCorrect: {
    background: "rgba(34,197,94,0.15)",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 16,
    padding: "clamp(12px,3vw,20px) clamp(24px,6vw,40px)",
    textAlign: "center",
    backdropFilter: "blur(8px)",
  },
  feedbackWrong: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 16,
    padding: "clamp(12px,3vw,20px) clamp(24px,6vw,40px)",
    textAlign: "center",
    backdropFilter: "blur(8px)",
  },
  // Mic area
  micArea: {
    paddingBottom: "clamp(28px, 6vw, 48px)",
    paddingTop: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    zIndex: 10,
  },
  micBtn: {
    width: "clamp(64px, 18vw, 88px)",
    height: "clamp(64px, 18vw, 88px)",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(28px, 7vw, 38px)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
    WebkitTapHighlightColor: "transparent",
  },
  micLabel: {
    fontSize: "clamp(12px, 3vw, 14px)",
    color: "#6b7280",
    marginTop: 10,
  },
  // Waves
  wavesContainer: {
    display: "flex",
    alignItems: "flex-end",
    gap: 3,
    marginBottom: 14,
    height: 32,
  },
  waveBar: { width: 5, background: "#818cf8", borderRadius: 3 },
  // Game over
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "clamp(8px, 2vw, 16px)",
    margin: "clamp(20px, 5vw, 36px) 0",
    width: "100%",
    maxWidth: 360,
  },
  statCard: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "clamp(12px, 3vw, 20px) 8px",
    textAlign: "center",
  },
  statValue: { fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900 },
  statLabel: {
    fontSize: "clamp(10px, 2.5vw, 13px)",
    color: "#9ca3af",
    marginTop: 4,
  },
  // Flash overlays
  flashCorrect: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at center, rgba(34,197,94,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 5,
  },
  flashWrong: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at center, rgba(239,68,68,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 5,
  },
  // Floating emoji
  floatEmoji: {
    position: "absolute",
    fontSize: "clamp(48px, 12vw, 72px)",
    top: "28%",
    pointerEvents: "none",
  },
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z\s]/g, "")
    .trim();
}

function checkAnswer(alternatives, correctAnswer) {
  const normalized = normalizeText(correctAnswer);
  return alternatives.some((alt) => {
    const normalizedAlt = normalizeText(alt);
    if (normalizedAlt === normalized) return true;
    if (
      normalized.includes(normalizedAlt) ||
      normalizedAlt.includes(normalized)
    )
      return true;
    if (normalized.length > 3 && normalizedAlt.length > 3) {
      let diff = 0;
      const minLen = Math.min(normalized.length, normalizedAlt.length);
      const maxLen = Math.max(normalized.length, normalizedAlt.length);
      if (maxLen - minLen > 1) return false;
      for (let i = 0; i < minLen; i++) {
        if (normalized[i] !== normalizedAlt[i]) diff++;
      }
      diff += maxLen - minLen;
      return diff <= 1;
    }
    return false;
  });
}

export default function Game() {
  const [gameState, setGameState] = useState("start");
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [feedback, setFeedback] = useState(null);
  const [floatingEmoji, setFloatingEmoji] = useState(null);
  const [wordAnim, setWordAnim] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [emojiKey, setEmojiKey] = useState(0);
  const [textInput, setTextInput] = useState("");
  const textInputRef = useRef(null);
  const timerRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  const currentWord = words[currentIndex];

  const endGame = useCallback(() => {
    clearInterval(timerRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setGameState("gameover");
    playGameOver();
    vibrate([200, 100, 200]);
  }, []);

  const handleResult = useCallback(
    (alternatives) => {
      if (gameState !== "playing" || !currentWord) return;
      const isCorrect = checkAnswer(alternatives, currentWord.ru);

      if (isCorrect) {
        const newStreak = streak + 1;
        setScore((s) => s + (newStreak >= 3 ? 2 : 1));
        setCorrectCount((c) => c + 1);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setFeedback({ type: "correct", answer: currentWord.ru });
        setFloatingEmoji(currentWord.emoji);
        setEmojiKey((k) => k + 1);
        setWordAnim("animate-pop-in");

        if (newStreak >= 3 && newStreak % 3 === 0) {
          playStreak();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#22c55e", "#a855f7", "#eab308", "#3b82f6"],
          });
          vibrate([50, 30, 50]);
        } else {
          playSuccess();
          vibrate(50);
        }
      } else {
        setStreak(0);
        setFeedback({
          type: "wrong",
          answer: currentWord.ru,
          said: alternatives[0] || "...",
        });
        setWordAnim("animate-shake");
        playFail();
        vibrate([100, 50, 100]);
      }

      setGameState("feedback");
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
        setFloatingEmoji(null);
        setWordAnim("");
        if (currentIndex + 1 < words.length) {
          setCurrentIndex((i) => i + 1);
          setGameState("playing");
        } else {
          endGame();
        }
      }, 1500);
    },
    [gameState, currentWord, streak, currentIndex, words.length, endGame],
  );

  const { isListening, startListening } = useSpeechRecognition({
    lang: "ru-RU",
    onResult: handleResult,
  });

  const hasSpeechAPI = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  const handleTextSubmit = useCallback(() => {
    const val = textInput.trim();
    if (!val || gameState !== "playing") return;
    handleResult([val.toLowerCase()]);
    setTextInput("");
  }, [textInput, gameState, handleResult]);

  const startGame = useCallback(() => {
    playStart();
    setCountdown(3);
  }, []);

  const countdownTimerRef = useRef(null);
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      const shuffled = getShuffledWords().slice(0, WORDS_PER_ROUND);
      setWords(shuffled);
      setCurrentIndex(0);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setBestStreak(0);
      setTimeLeft(GAME_DURATION);
      setFeedback(null);
      setCountdown(null);
      setGameState("playing");
      return;
    }
    playCountdown();
    countdownTimerRef.current = setTimeout(
      () => setCountdown((c) => c - 1),
      800,
    );
    return () => clearTimeout(countdownTimerRef.current);
  }, [countdown]);

  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        if (t <= 6) playCountdown();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, endGame]);

  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0;
  const timerDanger = timeLeft <= 10;

  // ─── COUNTDOWN ─── (ПЕРЕД start screen, чтобы показывался при countdown > 0)
  if (countdown !== null && countdown > 0) {
    return (
      <div style={S.page}>
        <div key={countdown} className="animate-pop-in" style={S.countdownNum}>
          {countdown}
        </div>
      </div>
    );
  }

  // ─── START SCREEN ───
  if (gameState === "start") {
    return (
      <div style={S.page}>
        <div style={S.center} className="animate-pop-in">
          <div style={S.bigEmoji}>🎙️</div>
          <h1 style={S.title}>VoiceFlip</h1>
          <p style={S.subtitle}>Учи слова голосом</p>
          <p style={S.desc}>
            Увидишь слово на английском → скажи перевод на русском
          </p>
          <button
            onClick={startGame}
            style={S.btn}
            className="animate-glow-pulse"
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.95)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) =>
              (e.currentTarget.style.transform = "scale(0.95)")
            }
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Начать игру
          </button>
          <div style={S.meta}>
            <span>⏱ {GAME_DURATION}с</span>
            <span>•</span>
            <span>🎯 {WORDS_PER_ROUND} слов</span>
            <span>•</span>
            <span>🔥 Streak бонусы</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── GAME OVER ───
  if (gameState === "gameover") {
    const totalAnswered = Math.max(currentIndex, 1);
    const accuracy = Math.round((correctCount / totalAnswered) * 100);
    return (
      <div style={S.page}>
        <div
          style={{
            ...S.center,
            padding: "0 24px",
            width: "100%",
            maxWidth: 420,
          }}
          className="animate-pop-in"
        >
          <div
            style={{ fontSize: "clamp(56px, 14vw, 80px)", marginBottom: 12 }}
          >
            {score >= 15 ? "🏆" : score >= 10 ? "⭐" : score >= 5 ? "👏" : "💪"}
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 7vw, 40px)",
              fontWeight: 900,
              margin: "0 0 8px",
            }}
          >
            Время вышло!
          </h2>

          <div style={S.statsGrid}>
            <div style={S.statCard}>
              <div style={{ ...S.statValue, color: "#4ade80" }}>{score}</div>
              <div style={S.statLabel}>Очки</div>
            </div>
            <div style={S.statCard}>
              <div style={{ ...S.statValue, color: "#fb923c" }}>
                🔥{bestStreak}
              </div>
              <div style={S.statLabel}>Лучший streak</div>
            </div>
            <div style={S.statCard}>
              <div style={{ ...S.statValue, color: "#60a5fa" }}>
                {accuracy}%
              </div>
              <div style={S.statLabel}>Точность</div>
            </div>
          </div>

          <button
            onClick={startGame}
            style={S.btn}
            className="animate-glow-pulse"
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.95)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) =>
              (e.currentTarget.style.transform = "scale(0.95)")
            }
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Ещё раз 🔄
          </button>
        </div>
      </div>
    );
  }

  // ─── PLAYING / FEEDBACK ───
  const micBtnStyle = {
    ...S.micBtn,
    background: isListening
      ? "#ef4444"
      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
    boxShadow: isListening
      ? "0 0 30px rgba(239,68,68,0.5)"
      : "0 0 20px rgba(99,102,241,0.4)",
    transform: isListening ? "scale(1.1)" : "scale(1)",
  };

  return (
    <div style={S.pagePlaying}>
      {/* Flash overlays */}
      {feedback?.type === "correct" && <div style={S.flashCorrect} />}
      {feedback?.type === "wrong" && <div style={S.flashWrong} />}

      {/* Top bar */}
      <div style={S.topBar}>
        <div
          style={{
            color: timerDanger ? "#ef4444" : "#fff",
            fontVariantNumeric: "tabular-nums",
          }}
          className={timerDanger ? "animate-timer-pulse" : ""}
        >
          ⏱ {timeLeft}s
        </div>
        <div>🎯 {score}</div>
        <div
          style={{ color: streak >= 3 ? "#fb923c" : "#6b7280" }}
          className={streak >= 3 ? "animate-streak-fire" : ""}
        >
          🔥 {streak}
        </div>
      </div>

      {/* Progress bar */}
      <div style={S.progressOuter}>
        <div style={{ ...S.progressInner, width: `${progress}%` }} />
      </div>

      {/* Word area */}
      <div style={S.wordArea}>
        {/* Floating emoji */}
        {floatingEmoji && (
          <div key={emojiKey} className="animate-float-up" style={S.floatEmoji}>
            {floatingEmoji}
          </div>
        )}

        <div style={S.wordNum}>
          {currentIndex + 1} / {words.length}
        </div>

        {currentWord && (
          <div style={S.center} className={wordAnim}>
            <div style={S.wordEmoji}>{currentWord.emoji}</div>
            <div style={S.wordText}>{currentWord.en}</div>
            <div style={S.wordHint}>Скажи перевод на русском 🇷🇺</div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div style={S.feedbackBox} className="animate-slide-up">
            {feedback.type === "correct" ? (
              <div style={S.feedbackCorrect}>
                <div
                  style={{
                    fontSize: "clamp(22px, 6vw, 32px)",
                    fontWeight: 900,
                    color: "#4ade80",
                  }}
                >
                  ✓ Верно!
                </div>
                <div
                  style={{
                    fontSize: "clamp(16px, 4vw, 22px)",
                    color: "#86efac",
                    marginTop: 4,
                  }}
                >
                  {feedback.answer}
                </div>
              </div>
            ) : (
              <div style={S.feedbackWrong}>
                <div
                  style={{
                    fontSize: "clamp(22px, 6vw, 32px)",
                    fontWeight: 900,
                    color: "#f87171",
                  }}
                >
                  ✗ Неверно
                </div>
                <div
                  style={{
                    fontSize: "clamp(12px, 3vw, 14px)",
                    color: "#fca5a5",
                    marginTop: 4,
                  }}
                >
                  Ты сказал: «{feedback.said}»
                </div>
                <div
                  style={{
                    fontSize: "clamp(16px, 4vw, 22px)",
                    color: "#fff",
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  Правильно: {feedback.answer}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ввод: микрофон + текст */}
      <div style={S.micArea}>
        {isListening && (
          <div style={S.wavesContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  ...S.waveBar,
                  animation: `listening-wave 0.8s ease-in-out ${i * 0.15}s infinite`,
                  height: 8,
                }}
              />
            ))}
          </div>
        )}

        {/* Текстовый ввод */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            width: "100%",
            maxWidth: 320,
            padding: "0 16px",
          }}
        >
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTextSubmit();
            }}
            placeholder="Введи перевод..."
            disabled={gameState !== "playing"}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "12px 16px",
              color: "#fff",
              fontSize: "clamp(14px, 4vw, 18px)",
              fontFamily: "inherit",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          />
          <button
            onClick={handleTextSubmit}
            disabled={gameState !== "playing" || !textInput.trim()}
            style={{
              background: textInput.trim()
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 12,
              padding: "12px 18px",
              color: "#fff",
              fontSize: "clamp(14px, 4vw, 18px)",
              fontWeight: 700,
              cursor: textInput.trim() ? "pointer" : "default",
              fontFamily: "inherit",
              opacity: textInput.trim() ? 1 : 0.5,
            }}
          >
            ✓
          </button>
        </div>

        {/* Кнопка микрофона */}
        {hasSpeechAPI && (
          <>
            <button
              style={micBtnStyle}
              onClick={() => {
                if (gameState === "playing" && !isListening) {
                  startListening();
                }
              }}
            >
              {isListening ? (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    background: "#fff",
                    borderRadius: 3,
                  }}
                />
              ) : (
                "🎤"
              )}
            </button>
            <div style={S.micLabel}>
              {isListening ? "Слушаю..." : "или нажми 🎤"}
            </div>
          </>
        )}

        {!hasSpeechAPI && (
          <div
            style={{
              fontSize: "clamp(11px, 2.5vw, 13px)",
              color: "#6b7280",
              marginTop: 4,
            }}
          >
            Голосовой ввод недоступен в этом браузере
          </div>
        )}
      </div>
    </div>
  );
}
