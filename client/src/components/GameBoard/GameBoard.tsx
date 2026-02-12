import { useEffect, useCallback } from 'react';
import HexCanvas from '../HexGrid/HexCanvas';
import GameInfoPanel from '../UI/GameInfoPanel';
import VictoryScreen from '../UI/VictoryScreen';
import CityPanel from '../UI/CityPanel';
import { useGameStore } from '../../store/gameStore';
import { HexCoord, coordKey, GamePhase } from 'shared';

interface GameBoardProps {
  onBackToMenu: () => void;
}

export default function GameBoard({ onBackToMenu }: GameBoardProps) {
  const {
    initGame,
    selectUnit,
    moveUnit,
    attackUnit,
    endTurn,
    foundCity,
    selectCity,
    getUnitAtCoord,
    getCityAtCoord,
    selectedUnitId,
    selectedCityId,
    units,
    cities,
    players,
    getCurrentPlayer,
    phase,
    winner,
    addLog,
    setHoveredCoord,
  } = useGameStore();

  // 初始化游戏
  useEffect(() => {
    initGame(20, 15);
  }, [initGame]);

  // 处理格子点击
  const handleCellClick = useCallback((coord: HexCoord) => {
    if (phase !== GamePhase.PLAYER_TURN) return;

    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isAI) return;

    const clickedUnit = getUnitAtCoord(coord);
    const clickedCity = getCityAtCoord(coord);
    const selectedUnit = selectedUnitId ? units.get(selectedUnitId) : null;

    // 如果有选中的单位
    if (selectedUnit) {
      // 点击了可攻击的敌方单位
      if (clickedUnit && clickedUnit.playerId !== currentPlayer.id) {
        const attackableCoords = useGameStore.getState().getAttackableCoords(selectedUnitId!);
        if (attackableCoords.has(coordKey(coord))) {
          const result = attackUnit(selectedUnitId!, clickedUnit.id);
          if (result) {
            addLog(`你的${getUnitTypeName(selectedUnit.type)}攻击了敌方${getUnitTypeName(clickedUnit.type)}！`);
            if (result.defenderKilled) {
              addLog(`敌方${getUnitTypeName(clickedUnit.type)}被消灭！`);
            }
            if (result.attackerKilled) {
              addLog(`你的${getUnitTypeName(selectedUnit.type)}被消灭！`);
            }
          }
          return;
        }
      }

      // 点击了可移动的空格子（没有单位）
      if (!clickedUnit) {
        const movableCoords = useGameStore.getState().getMovableCoords(selectedUnitId!);
        if (movableCoords.has(coordKey(coord))) {
          const result = moveUnit(selectedUnitId!, coord);
          if (result.success) {
            addLog(`${getUnitTypeName(selectedUnit.type)}移动到新位置。`);
          }
          return;
        }
      }

      // 点击了自己的其他单位
      if (clickedUnit && clickedUnit.playerId === currentPlayer.id) {
        selectUnit(clickedUnit.id);
        return;
      }

      // 点击了其他地方，取消选择
      selectUnit(null);
      return;
    }

    // 没有选中的单位
    // 检查是否点击了己方城市
    if (clickedCity && clickedCity.playerId === currentPlayer.id) {
      selectCity(clickedCity.id);
      return;
    }

    // 尝试选择单位
    if (clickedUnit && clickedUnit.playerId === currentPlayer.id) {
      selectUnit(clickedUnit.id);
    }
  }, [phase, getCurrentPlayer, getUnitAtCoord, getCityAtCoord, selectedUnitId, units, selectUnit, moveUnit, attackUnit, addLog, selectCity]);

  // 处理鼠标悬停
  const handleCellHover = useCallback((coord: HexCoord | null) => {
    setHoveredCoord(coord);
  }, [setHoveredCoord]);

  // 处理结束回合
  const handleEndTurn = useCallback(() => {
    if (phase !== GamePhase.PLAYER_TURN) return;

    addLog('你结束了回合。');
    endTurn();
  }, [phase, endTurn, addLog]);

  // 处理建造城市
  const handleFoundCity = useCallback((settlerId: string) => {
    const city = foundCity(settlerId);
    if (city) {
      // 建造成功后可以选择新城市
      selectCity(city.id);
    }
  }, [foundCity, selectCity]);

  // 处理返回菜单
  const handleBackToMenu = useCallback(() => {
    onBackToMenu();
  }, [onBackToMenu]);

  // 获取选中的城市
  const selectedCity = selectedCityId ? cities.get(selectedCityId) : null;

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* 游戏地图 */}
      <HexCanvas
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
      />

      {/* 信息面板 */}
      <GameInfoPanel
        onEndTurn={handleEndTurn}
        onBackToMenu={handleBackToMenu}
        onFoundCity={handleFoundCity}
      />

      {/* 城市面板 */}
      {selectedCity && (
        <CityPanel
          city={selectedCity}
          onClose={() => selectCity(null)}
        />
      )}

      {/* 胜利/失败画面 */}
      {phase === GamePhase.GAME_OVER && winner && (
        <VictoryScreen
          winner={players.find(p => p.id === winner)!}
          onRestart={() => initGame(20, 15)}
          onBackToMenu={handleBackToMenu}
        />
      )}
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
