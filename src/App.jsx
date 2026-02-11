import CameraBackground from "./components/CameraBackground";
import Game from "./components/Game";

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0a0a0f",
        position: "relative",
      }}
    >
      {/* Фронтальная камера на весь экран как фон */}
      <CameraBackground />
      {/* UI игры поверх камеры */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          height: "100%",
        }}
      >
        <Game />
      </div>
    </div>
  );
}

export default App;
