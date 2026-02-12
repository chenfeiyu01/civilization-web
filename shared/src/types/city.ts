import { HexCoord } from './map';

// 可生产的单位类型
export type ProducableType = 'warrior' | 'archer' | 'cavalry' | 'settler' | 'worker';

// 生产配置项
export interface ProductionItem {
  type: ProducableType;
  name: string;
  cost: number;           // 所需生产力
  icon: string;           // 显示图标
}

// 生产队列项
export interface ProductionQueueItem {
  id: string;
  item: ProductionItem;
  progress: number;       // 已投入的生产力
}

// 城市资源
export interface CityResources {
  food: number;           // 食物产出
  production: number;     // 生产力产出
  gold: number;           // 金币产出
}

// 城市接口
export interface City {
  id: string;
  name: string;
  playerId: string;
  coord: HexCoord;
  population: number;           // 人口
  resources: CityResources;     // 每回合资源产出
  productionQueue: ProductionQueueItem[];
  isCapital: boolean;           // 是否首都
  growthProgress: number;       // 人口增长进度
}

// 可生产单位配置
export const PRODUCTION_ITEMS: ProductionItem[] = [
  { type: 'warrior', name: '战士', cost: 40, icon: '⚔️' },
  { type: 'archer', name: '弓箭手', cost: 50, icon: '🏹' },
  { type: 'cavalry', name: '骑兵', cost: 60, icon: '🐴' },
  { type: 'settler', name: '殖民者', cost: 80, icon: '🚶' },
  { type: 'worker', name: '工人', cost: 35, icon: '🔨' },
];

// 城市名称列表
export const CITY_NAMES: string[] = [
  '北京', '上海', '广州', '深圳', '成都',
  '杭州', '南京', '武汉', '西安', '重庆',
  '天津', '苏州', '长沙', '郑州', '青岛',
  '大连', '宁波', '厦门', '福州', '济南',
  '哈尔滨', '沈阳', '长春', '昆明', '贵阳',
  '南宁', '海口', '兰州', '银川', '西宁',
];

// 获取人口增长阈值
export function getGrowthThreshold(population: number): number {
  return Math.floor(15 + population * 10 + population * population * 2);
}
