import { HexCoord } from './map';

// 动画类型
export enum AnimationType {
  UNIT_MOVE = 'unit_move',
  UNIT_ATTACK = 'unit_attack',
  CITY_BUILD = 'city_build',
  DAMAGE_NUMBER = 'damage_number',
}

// 动画状态
export enum AnimationState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
}

// 基础动画接口
export interface Animation {
  id: string;
  type: AnimationType;
  state: AnimationState;
  startTime: number;
  duration: number;
}

// 单位移动动画
export interface UnitMoveAnimation extends Animation {
  type: AnimationType.UNIT_MOVE;
  unitId: string;
  from: HexCoord;
  to: HexCoord;
  path: HexCoord[];
}

// 单位攻击动画
export interface UnitAttackAnimation extends Animation {
  type: AnimationType.UNIT_ATTACK;
  attackerId: string;
  attackerCoord: HexCoord;
  targetCoord: HexCoord;
  damage: number;
}

// 城市建造动画
export interface CityBuildAnimation extends Animation {
  type: AnimationType.CITY_BUILD;
  coord: HexCoord;
  cityName: string;
}

// 伤害数字动画
export interface DamageNumberAnimation extends Animation {
  type: AnimationType.DAMAGE_NUMBER;
  x: number;
  y: number;
  damage: number;
  isHeal: boolean;
}

// 粒子配置
export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;              // x方向速度
  vy: number;              // y方向速度
  life: number;            // 已存活时间
  maxLife: number;         // 最大生命周期
  size: number;
  color: string;
  alpha: number;
  gravity?: number;
}

// 动画回调
export type AnimationCallback = (animation: Animation) => void;
