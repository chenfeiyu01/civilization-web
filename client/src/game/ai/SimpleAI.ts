import { useGameStore } from '../../store/gameStore';
import { Unit, HexCoord, UNIT_STATS, hexDistance } from 'shared';

// AI延迟时间（毫秒）
const AI_DELAY = 300;

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 执行AI回合
export async function executeAITurn(): Promise<void> {
  const store = useGameStore.getState();
  const currentPlayer = store.getCurrentPlayer();

  if (!currentPlayer || !currentPlayer.isAI) return;

  // 获取AI的所有单位
  const aiUnits = store.getPlayerUnits(currentPlayer.id);

  // 为每个单位执行行动
  for (const unit of aiUnits) {
    const currentState = useGameStore.getState();
    if (currentState.phase !== 'ai_turn') break; // 检查游戏状态

    await executeUnitAction(unit);
    await delay(AI_DELAY);
  }

  // AI回合结束
  await delay(AI_DELAY);
  useGameStore.getState().endTurn();
}

// 执行单个单位的行动
async function executeUnitAction(unit: Unit): Promise<void> {
  // 1. 尝试攻击
  if (!unit.hasAttacked) {
    const attackResult = tryAttack(unit);
    if (attackResult) {
      // 更新单位引用
      const updatedUnit = useGameStore.getState().units.get(unit.id);
      if (updatedUnit) {
        unit = updatedUnit;
      }
    }
  }

  // 2. 如果还有移动点数，尝试移动
  if (unit.movementPoints > 0) {
    await tryMove(unit);
  }
}

// 尝试攻击
function tryAttack(unit: Unit): boolean {
  const store = useGameStore.getState();
  const unitStats = UNIT_STATS[unit.type];
  const attackRange = Math.max(unitStats.range, 1);

  // 找到攻击范围内的敌人
  const enemies = Array.from(store.units.values()).filter(
    (u: Unit) => u.playerId !== unit.playerId
  );

  const targetableEnemies = enemies.filter(
    (enemy: Unit) => hexDistance(unit.coord, enemy.coord) <= attackRange
  );

  if (targetableEnemies.length === 0) return false;

  // 选择血量最低的敌人
  targetableEnemies.sort((a: Unit, b: Unit) => a.health - b.health);
  const target = targetableEnemies[0];

  // 执行攻击
  const result = store.attackUnit(unit.id, target.id);

  if (result) {
    store.addLog(`AI的${getUnitTypeName(unit.type)}攻击了你的${getUnitTypeName(target.type)}！`);
  }

  return !!result;
}

// 尝试移动
async function tryMove(unit: Unit): Promise<void> {
  const store = useGameStore.getState();

  // 找到最近的敌人
  const enemies = Array.from(store.units.values()).filter(
    (u: Unit) => u.playerId !== unit.playerId
  );

  if (enemies.length === 0) return;

  // 选择最近的敌人
  let nearestEnemy: Unit = enemies[0];
  let minDistance = hexDistance(unit.coord, nearestEnemy.coord);

  enemies.forEach((enemy: Unit) => {
    const dist = hexDistance(unit.coord, enemy.coord);
    if (dist < minDistance) {
      minDistance = dist;
      nearestEnemy = enemy;
    }
  });

  // 获取可移动的格子
  const movableCoords = store.getMovableCoords(unit.id);
  if (movableCoords.size === 0) return;

  // 选择最接近敌人的格子
  let bestCoord: HexCoord | null = null;
  let bestDistance = Infinity;

  movableCoords.forEach((key: string) => {
    const [q, r] = key.split(',').map(Number);
    const coord: HexCoord = { q, r };
    const dist = hexDistance(coord, nearestEnemy.coord);

    if (dist < bestDistance) {
      bestDistance = dist;
      bestCoord = coord;
    }
  });

  if (bestCoord) {
    const result = store.moveUnit(unit.id, bestCoord);
    if (result.success) {
      store.addLog(`AI的${getUnitTypeName(unit.type)}移动了。`);
    }
  }
}

// 获取单位类型名称
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
