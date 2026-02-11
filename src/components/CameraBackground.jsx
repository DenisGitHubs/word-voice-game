import { useEffect, useRef, useState } from "react";

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    overflow: "hidden",
    background: "#0a0a1a",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)", // зеркалим фронталку
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(2px)",
  },
  errorBox: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: "clamp(12px, 3vw, 14px)",
    textAlign: "center",
    padding: 20,
  },
};

export default function CameraBackground() {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStarted(true);
        }
      } catch (err) {
        console.log("[Camera] Ошибка:", err.message);
        setError(err.message);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      {!error && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            ...styles.video,
            opacity: started ? 1 : 0,
            transition: "opacity 0.5s",
          }}
        />
      )}
      {/* Затемнение поверх видео чтобы текст читался */}
      <div style={styles.overlay} />
      {error && (
        <div style={styles.errorBox}>
          Камера недоступна
        </div>
      )}
    </div>
  );
}
