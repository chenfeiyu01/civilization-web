// 地形类型
export enum TerrainType {
  PLAINS = 'plains',       // 平原
  HILLS = 'hills',         // 丘陵
  MOUNTAINS = 'mountains', // 山脉
  WATER = 'water',         // 水域
  FOREST = 'forest',       // 森林
  DESERT = 'desert',       // 沙漠
}

// 地形属性
export interface TerrainProperties {
  movementCost: number;    // 移动消耗
  defenseBonus: number;    // 防御加成
  food: number;            // 食物产出
  production: number;      // 生产力
  passable: boolean;       // 是否可通行
  color: string;           // 显示颜色
}

// 地形配置
export const TERRAIN_PROPERTIES: Record<TerrainType, TerrainProperties> = {
  [TerrainType.PLAINS]: {
    movementCost: 1,
    defenseBonus: 0,
    food: 2,
    production: 1,
    passable: true,
    color: '#90EE90', // 浅绿色
  },
  [TerrainType.HILLS]: {
    movementCost: 2,
    defenseBonus: 0.25,
    food: 1,
    production: 2,
    passable: true,
    color: '#D2B48C', // 棕褐色
  },
  [TerrainType.MOUNTAINS]: {
    movementCost: Infinity,
    defenseBonus: 0.5,
    food: 0,
    production: 0,
    passable: false,
    color: '#808080', // 灰色
  },
  [TerrainType.WATER]: {
    movementCost: 1,
    defenseBonus: 0,
    food: 2,
    production: 0,
    passable: true,
    color: '#4169E1', // 皇家蓝
  },
  [TerrainType.FOREST]: {
    movementCost: 2,
    defenseBonus: 0.15,
    food: 1,
    production: 2,
    passable: true,
    color: '#228B22', // 森林绿
  },
  [TerrainType.DESERT]: {
    movementCost: 1,
    defenseBonus: -0.1,
    food: 0,
    production: 1,
    passable: true,
    color: '#F4A460', // 沙褐色
  },
};

// 六边形坐标（Axial坐标系统）
export interface HexCoord {
  q: number;  // 列坐标
  r: number;  // 行坐标
}

// 地图单元格
export interface HexCell {
  coord: HexCoord;
  terrain: TerrainType;
  unitId?: string;  // 占据该格子的单位ID
  cityId?: string;  // 占据该格子的城市ID
}

// 地图数据
export interface GameMap {
  width: number;
  height: number;
  cells: Map<string, HexCell>;  // key: "q,r"
}

// Axial坐标方向（6个相邻方向）
export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },   // 右
  { q: 1, r: -1 },  // 右上
  { q: 0, r: -1 },  // 左上
  { q: -1, r: 0 },  // 左
  { q: -1, r: 1 },  // 左下
  { q: 0, r: 1 },   // 右下
];

// 坐标工具函数
export function coordKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function parseCoordKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function hexAdd(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(dir => hexAdd(coord, dir));
}

export function hexesInRange(center: HexCoord, range: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      results.push(hexAdd(center, { q, r }));
    }
  }
  return results;
}
