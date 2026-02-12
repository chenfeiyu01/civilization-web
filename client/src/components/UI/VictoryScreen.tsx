import { Player } from 'shared';

interface VictoryScreenProps {
  winner: Player;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export default function VictoryScreen({ winner, onRestart, onBackToMenu }: VictoryScreenProps) {
  const isPlayer = !winner.isAI;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="game-panel p-8 text-center animate-bounce-in">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ color: winner.color }}
        >
          {isPlayer ? '胜利！' : '失败...'}
        </h1>

        <p className="text-2xl text-gray-300 mb-8">
          {winner.name} {isPlayer ? '征服了世界！' : '统治了这片土地...'}
        </p>

        <div className="text-6xl mb-8">
          {isPlayer ? '🏆' : '💀'}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="game-btn px-8 py-3"
          >
            再来一局
          </button>
          <button
            onClick={onBackToMenu}
            className="game-btn bg-gray-600 hover:bg-gray-500 px-8 py-3"
          >
            返回菜单
          </button>
        </div>
      </div>
    </div>
  );
}
