import { useGameStore } from '../../store/gameStore';
import { UNIT_STATS, UNIT_DISPLAY } from 'shared';

interface GameInfoPanelProps {
  onEndTurn: () => void;
  onBackToMenu: () => void;
}

export default function GameInfoPanel({ onEndTurn, onBackToMenu }: GameInfoPanelProps) {
  const {
    currentPlayerIndex,
    players,
    turn,
    phase,
    selectedUnitId,
    units,
    gameLog,
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];
  const selectedUnit = selectedUnitId ? units.get(selectedUnitId) : null;
  const unitStats = selectedUnit ? UNIT_STATS[selectedUnit.type] : null;

  return (
    <div className="absolute top-4 right-4 w-72 game-panel p-4 z-10">
      {/* 回合信息 */}
      <div className="mb-4 text-center">
        <div className="text-lg text-gray-400">回合 {turn}</div>
        <div
          className="text-2xl font-bold"
          style={{ color: currentPlayer?.color }}
        >
          {currentPlayer?.name}的回合
        </div>
        {phase === 'ai_turn' && (
          <div className="text-yellow-400 animate-pulse mt-2">
            AI思考中...
          </div>
        )}
      </div>

      {/* 选中单位信息 */}
      {selectedUnit && unitStats && (
        <div className="mb-4 p-3 bg-game-bg rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{UNIT_DISPLAY[selectedUnit.type].symbol}</span>
            <span className="text-lg font-bold text-white">
              {getUnitTypeName(selectedUnit.type)}
            </span>
          </div>

          {/* 血量条 */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>HP</span>
              <span>{selectedUnit.health}/{unitStats.maxHealth}</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{
                  width: `${(selectedUnit.health / unitStats.maxHealth) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 属性 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <span className="text-red-400 mr-1">⚔</span>
              <span className="text-gray-300">攻击: {unitStats.attack}</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-400 mr-1">🛡</span>
              <span className="text-gray-300">防御: {unitStats.defense}</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-400 mr-1">👟</span>
              <span className="text-gray-300">移动: {selectedUnit.movementPoints}/{unitStats.movement}</span>
            </div>
            <div className="flex items-center">
              <span className="text-purple-400 mr-1">👁</span>
              <span className="text-gray-300">视野: {unitStats.sight}</span>
            </div>
          </div>

          {/* 攻击范围 */}
          {unitStats.range > 0 && (
            <div className="mt-2 text-sm text-gray-400">
              攻击范围: {unitStats.range}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="space-y-2 mb-4">
        <button
          onClick={onEndTurn}
          disabled={phase !== 'player_turn'}
          className="w-full game-btn"
        >
          结束回合
        </button>
        <button
          onClick={onBackToMenu}
          className="w-full game-btn bg-gray-600 hover:bg-gray-500"
        >
          返回菜单
        </button>
      </div>

      {/* 游戏日志 */}
      <div className="border-t border-game-accent pt-3">
        <div className="text-sm text-gray-400 mb-2">游戏日志</div>
        <div className="h-32 overflow-y-auto text-xs space-y-1">
          {gameLog.map((log, index) => (
            <div key={index} className="text-gray-300">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getUnitTypeName(type: string): string {
  const names: Record<string, string> = {
    warrior: '战士',
    archer: '弓箭手',
    cavalry: '骑兵',
    settler: '殖民者',
    worker: '工人',
  };
  return names[type] || type;
}
