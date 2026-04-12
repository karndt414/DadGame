import { createRoot } from "react-dom/client";
import { useEffect, useRef } from "react";
import "./style.css";
import { createGame } from "./phaserGame";

function App() {
  const gameContainerRef = useRef(null);

  useEffect(() => {
    if (!gameContainerRef.current) {
      return undefined;
    }

    const game = createGame(gameContainerRef.current);

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="game-shell">
      <div id="game-container" ref={gameContainerRef} />
    </div>
  );
}

const root = createRoot(document.querySelector("#app"));
root.render(<App />);
