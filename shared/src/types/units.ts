import { HexCoord } from './map';

// 单位类型
export enum UnitType {
  WARRIOR = 'warrior',     // 战士
  ARCHER = 'archer',       // 弓箭手
  CAVALRY = 'cavalry',     // 骑兵
  SETTLER = 'settler',     // 殖民者
  WORKER = 'worker',       // 工人
}

// 单位属性模板
export interface UnitStats {
  maxHealth: number;
  attack: number;
  defense: number;
  movement: number;
  range: number;         // 攻击范围，0表示近战
  sight: number;         // 视野范围
}

// 单位类型配置
export const UNIT_STATS: Record<UnitType, UnitStats> = {
  [UnitType.WARRIOR]: {
    maxHealth: 100,
    attack: 25,
    defense: 20,
    movement: 2,
    range: 0,
    sight: 2,
  },
  [UnitType.ARCHER]: {
    maxHealth: 70,
    attack: 20,
    defense: 10,
    movement: 2,
    range: 2,
    sight: 3,
  },
  [UnitType.CAVALRY]: {
    maxHealth: 90,
    attack: 22,
    defense: 15,
    movement: 4,
    range: 0,
    sight: 3,
  },
  [UnitType.SETTLER]: {
    maxHealth: 50,
    attack: 0,
    defense: 5,
    movement: 2,
    range: 0,
    sight: 2,
  },
  [UnitType.WORKER]: {
    maxHealth: 50,
    attack: 0,
    defense: 5,
    movement: 2,
    range: 0,
    sight: 1,
  },
};

// 玩家/势力
export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  color: string;
}

// 游戏单位
export interface Unit {
  id: string;
  type: UnitType;
  playerId: string;
  coord: HexCoord;
  health: number;
  movementPoints: number;
  hasAttacked: boolean;
  isFortified: boolean;
}

// 单位显示配置
export const UNIT_DISPLAY: Record<UnitType, { symbol: string; color: string }> = {
  [UnitType.WARRIOR]: { symbol: '⚔', color: '#FFD700' },
  [UnitType.ARCHER]: { symbol: '🏹', color: '#90EE90' },
  [UnitType.CAVALRY]: { symbol: '🐴', color: '#DDA0DD' },
  [UnitType.SETTLER]: { symbol: '🚶', color: '#87CEEB' },
  [UnitType.WORKER]: { symbol: '🔨', color: '#F5DEB3' },
};
