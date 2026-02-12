import { HexCoord, GameMap } from './map';
import { Unit, Player } from './units';

// 游戏阶段
export enum GamePhase {
  SETUP = 'setup',
  PLAYER_TURN = 'player_turn',
  AI_TURN = 'ai_turn',
  GAME_OVER = 'game_over',
}

// 战斗结果
export interface CombatResult {
  attackerId: string;
  defenderId: string;
  attackerDamage: number;
  defenderDamage: number;
  defenderKilled: boolean;
  attackerKilled: boolean;
}

// 移动结果
export interface MoveResult {
  unitId: string;
  from: HexCoord;
  to: HexCoord;
  success: boolean;
  movementCost: number;
}

// 游戏动作
export type GameAction =
  | { type: 'MOVE_UNIT'; unitId: string; to: HexCoord }
  | { type: 'ATTACK_UNIT'; attackerId: string; defenderId: string }
  | { type: 'END_TURN' }
  | { type: 'SELECT_UNIT'; unitId: string }
  | { type: 'DESELECT_UNIT' };

// 游戏状态
export interface GameState {
  map: GameMap;
  units: Map<string, Unit>;
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  turn: number;
  selectedUnitId: string | null;
  winner: string | null;
}

// 游戏配置
export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  players: Player[];
}

// 默认游戏配置
export const DEFAULT_GAME_CONFIG: GameConfig = {
  mapWidth: 20,
  mapHeight: 15,
  players: [
    { id: 'player1', name: '玩家', isAI: false, color: '#3B82F6' },
    { id: 'player2', name: 'AI', isAI: true, color: '#EF4444' },
  ],
};

// 胜利条件
export enum VictoryCondition {
  DOMINATION = 'domination',  // 消灭所有敌方单位
  SCIENCE = 'science',        // 科技胜利
  CULTURE = 'culture',        // 文化胜利
}

// 游戏事件
export interface GameEvent {
  type: string;
  data: unknown;
  timestamp: number;
}
