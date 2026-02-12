import {
  GameMap,
  HexCell,
  HexCoord,
  TerrainType,
  coordKey,
} from 'shared';

export interface MapGeneratorOptions {
  width: number;
  height: number;
  waterRatio?: number;
  mountainRatio?: number;
  forestRatio?: number;
  seed?: number;
}

// 简单的伪随机数生成器
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export function generateMap(options: MapGeneratorOptions): GameMap {
  const {
    width,
    height,
    waterRatio = 0.15,
    mountainRatio = 0.1,
    forestRatio = 0.15,
    seed = Date.now(),
  } = options;

  const random = new SeededRandom(seed);
  const cells = new Map<string, HexCell>();

  // 首先生成基础地形
  for (let r = 0; r < height; r++) {
    const rOffset = Math.floor(r / 2);
    for (let q = -rOffset; q < width - rOffset; q++) {
      const coord: HexCoord = { q, r };
      const key = coordKey(coord);

      // 决定地形类型
      let terrain: TerrainType;
      const roll = random.next();

      if (roll < waterRatio) {
        terrain = TerrainType.WATER;
      } else if (roll < waterRatio + mountainRatio) {
        terrain = TerrainType.MOUNTAINS;
      } else if (roll < waterRatio + mountainRatio + forestRatio) {
        terrain = TerrainType.FOREST;
      } else if (random.next() < 0.3) {
        terrain = TerrainType.HILLS;
      } else if (random.next() < 0.1) {
        terrain = TerrainType.DESERT;
      } else {
        terrain = TerrainType.PLAINS;
      }

      cells.set(key, {
        coord,
        terrain,
      });
    }
  }

  // 平滑地形（让相同地形聚集）
  smoothTerrain(cells, 2);

  // 确保玩家出生点附近是可通行的
  ensurePassableSpawnPoints(cells, width, height);

  return {
    width,
    height,
    cells,
  };
}

function smoothTerrain(cells: Map<string, HexCell>, iterations: number): void {
  for (let i = 0; i < iterations; i++) {
    const changes: Array<{ key: string; terrain: TerrainType }> = [];

    cells.forEach((cell, key) => {
      // 山脉和森林保持不变
      if (cell.terrain === TerrainType.MOUNTAINS || cell.terrain === TerrainType.FOREST) {
        return;
      }

      // 获取相邻地形
      const neighbors = getNeighborTerrains(cells, cell.coord);
      if (neighbors.length === 0) return;

      // 计算最常见地形
      const terrainCounts = new Map<TerrainType, number>();
      neighbors.forEach(t => {
        terrainCounts.set(t, (terrainCounts.get(t) || 0) + 1);
      });

      let maxCount = 0;
      let dominantTerrain: TerrainType = cell.terrain;
      terrainCounts.forEach((count, terrain) => {
        if (count > maxCount) {
          maxCount = count;
          dominantTerrain = terrain;
        }
      });

      // 如果相邻地形主要是某种类型，则改变
      if (maxCount >= 3 && dominantTerrain !== cell.terrain) {
        changes.push({ key, terrain: dominantTerrain });
      }
    });

    changes.forEach(({ key, terrain }) => {
      const cell = cells.get(key);
      if (cell) {
        cell.terrain = terrain;
      }
    });
  }
}

function getNeighborTerrains(cells: Map<string, HexCell>, coord: HexCoord): TerrainType[] {
  const directions = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];

  const terrains: TerrainType[] = [];
  directions.forEach(dir => {
    const neighborCoord = { q: coord.q + dir.q, r: coord.r + dir.r };
    const neighbor = cells.get(coordKey(neighborCoord));
    if (neighbor) {
      terrains.push(neighbor.terrain);
    }
  });

  return terrains;
}

function ensurePassableSpawnPoints(
  cells: Map<string, HexCell>,
  width: number,
  height: number
): void {
  // 玩家1出生点（左下）
  const spawn1 = { q: 2, r: height - 3 };
  ensureAreaPassable(cells, spawn1);

  // 玩家2出生点（右上）
  const spawn2 = { q: width - 3, r: 2 };
  ensureAreaPassable(cells, spawn2);
}

function ensureAreaPassable(cells: Map<string, HexCell>, center: HexCoord): void {
  const directions = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
    { q: -1, r: 1 },
  ];

  directions.forEach(dir => {
    const coord = { q: center.q + dir.q, r: center.r + dir.r };
    const key = coordKey(coord);
    const cell = cells.get(key);
    if (cell && (cell.terrain === TerrainType.WATER || cell.terrain === TerrainType.MOUNTAINS)) {
      cell.terrain = TerrainType.PLAINS;
    }
  });
}
