import { useState } from 'react';
import GameBoard from './components/GameBoard/GameBoard';
import StartScreen from './components/UI/StartScreen';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleBackToMenu = () => {
    setGameStarted(false);
  };

  return (
    <div className="w-full h-full">
      {gameStarted ? (
        <GameBoard onBackToMenu={handleBackToMenu} />
      ) : (
        <StartScreen onStartGame={handleStartGame} />
      )}
    </div>
  );
}

export default App;
