import { create } from 'zustand';
import {
  GameMap,
  Unit,
  Player,
  GameState,
  GamePhase,
  HexCoord,
  coordKey,
  UnitType,
  UNIT_STATS,
  hexDistance,
  hexNeighbors,
  hexesInRange,
  TERRAIN_PROPERTIES,
  CombatResult,
  MoveResult,
  City,
  CityResources,
  ProducableType,
  PRODUCTION_ITEMS,
  CITY_NAMES,
  getGrowthThreshold,
} from 'shared';
import { generateMap } from '../game/map/MapGenerator';
import { executeAITurn } from '../game/ai/SimpleAI';

interface GameStore extends GameState {
  // 城市状态
  cities: Map<string, City>;
  selectedCityId: string | null;
  usedCityNames: Set<string>;

  // 初始化
  initGame: (mapWidth: number, mapHeight: number) => void;

  // 单位操作
  selectUnit: (unitId: string | null) => void;
  moveUnit: (unitId: string, to: HexCoord) => MoveResult;
  attackUnit: (attackerId: string, defenderId: string) => CombatResult | null;

  // 城市操作
  foundCity: (settlerId: string) => City | null;
  selectCity: (cityId: string | null) => void;
  addToProductionQueue: (cityId: string, itemType: ProducableType) => void;
  removeFromProductionQueue: (cityId: string, queueItemId: string) => void;
  getCityAtCoord: (coord: HexCoord) => City | undefined;
  getPlayerCities: (playerId: string) => City[];

  // 回合操作
  endTurn: () => void;

  // 计算属性
  getCurrentPlayer: () => Player | undefined;
  getPlayerUnits: (playerId: string) => Unit[];
  getUnitAtCoord: (coord: HexCoord) => Unit | undefined;
  getMovableCoords: (unitId: string) => Set<string>;
  getAttackableCoords: (unitId: string) => Set<string>;

  // UI状态
  hoveredCoord: HexCoord | null;
  setHoveredCoord: (coord: HexCoord | null) => void;
  gameLog: string[];
  addLog: (message: string) => void;
}

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 创建初始单位
function createInitialUnits(players: Player[], map: GameMap): Unit[] {
  const units: Unit[] = [];

  // 为每个玩家创建初始单位
  players.forEach((player, index) => {
    const isLeft = index === 0;
    const baseQ = isLeft ? 2 : map.width - 3;
    const baseR = isLeft ? map.height - 3 : 2;

    // 创建战士
    units.push({
      id: generateId(),
      type: UnitType.WARRIOR,
      playerId: player.id,
      coord: { q: baseQ, r: baseR },
      health: UNIT_STATS[UnitType.WARRIOR].maxHealth,
      movementPoints: UNIT_STATS[UnitType.WARRIOR].movement,
      hasAttacked: false,
      isFortified: false,
    });

    // 创建弓箭手
    units.push({
      id: generateId(),
      type: UnitType.ARCHER,
      playerId: player.id,
      coord: { q: baseQ + (isLeft ? 1 : -1), r: baseR },
      health: UNIT_STATS[UnitType.ARCHER].maxHealth,
      movementPoints: UNIT_STATS[UnitType.ARCHER].movement,
      hasAttacked: false,
      isFortified: false,
    });

    // 创建骑兵
    units.push({
      id: generateId(),
      type: UnitType.CAVALRY,
      playerId: player.id,
      coord: { q: baseQ, r: baseR + (isLeft ? -1 : 1) },
      health: UNIT_STATS[UnitType.CAVALRY].maxHealth,
      movementPoints: UNIT_STATS[UnitType.CAVALRY].movement,
      hasAttacked: false,
      isFortified: false,
    });
  });

  return units;
}

// 检查游戏是否结束
function checkGameOver(units: Unit[], players: Player[]): { isOver: boolean; winner: string | null } {
  for (const player of players) {
    const playerUnits = units.filter(u => u.playerId === player.id);
    if (playerUnits.length === 0) {
      // 该玩家没有单位了，另一个玩家获胜
      const winner = players.find(p => p.id !== player.id);
      return { isOver: true, winner: winner?.id || null };
    }
  }
  return { isOver: false, winner: null };
}

// 计算城市资源产出
function calculateCityResources(coord: HexCoord, map: GameMap): CityResources {
  const resources: CityResources = { food: 2, production: 2, gold: 1 };

  // 遍历城市周围的格子（半径2）
  const workableCoords = hexesInRange(coord, 2);

  workableCoords.forEach(c => {
    const cell = map.cells.get(coordKey(c));
    if (!cell || cell.cityId) return;

    const terrain = TERRAIN_PROPERTIES[cell.terrain];
    resources.food += terrain.food;
    resources.production += terrain.production;
  });

  return resources;
}

// 获取可用城市名称
function getAvailableCityName(usedNames: Set<string>): string {
  for (const name of CITY_NAMES) {
    if (!usedNames.has(name)) {
      return name;
    }
  }
  // 如果所有名称都用完了，生成随机名称
  return `新城${Math.floor(Math.random() * 1000)}`;
}

// 查找城市附近空位放置新单位
function findEmptyAdjacentCoord(cityCoord: HexCoord, state: GameState & { cities: Map<string, City> }): HexCoord | null {
  const neighbors = hexNeighbors(cityCoord);

  for (const coord of neighbors) {
    const key = coordKey(coord);
    const cell = state.map.cells.get(key);

    if (!cell) continue;
    if (!TERRAIN_PROPERTIES[cell.terrain].passable) continue;

    // 检查是否有单位占据
    const hasUnit = Array.from(state.units.values()).some(u => coordKey(u.coord) === key);
    if (hasUnit) continue;

    return coord;
  }

  return null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 初始状态
  map: { width: 0, height: 0, cells: new Map() },
  units: new Map(),
  players: [
    { id: 'player1', name: '玩家', isAI: false, color: '#3B82F6' },
    { id: 'player2', name: 'AI', isAI: true, color: '#EF4444' },
  ],
  currentPlayerIndex: 0,
  phase: GamePhase.SETUP,
  turn: 1,
  selectedUnitId: null,
  winner: null,
  hoveredCoord: null,
  gameLog: [],

  // 城市状态
  cities: new Map(),
  selectedCityId: null,
  usedCityNames: new Set(),

  // 初始化游戏
  initGame: (mapWidth: number, mapHeight: number) => {
    const map = generateMap({ width: mapWidth, height: mapHeight });
    const players = get().players;
    const initialUnits = createInitialUnits(players, map);
    const unitsMap = new Map<string, Unit>();
    initialUnits.forEach(unit => unitsMap.set(unit.id, unit));

    set({
      map,
      units: unitsMap,
      currentPlayerIndex: 0,
      phase: GamePhase.PLAYER_TURN,
      turn: 1,
      selectedUnitId: null,
      winner: null,
      gameLog: ['游戏开始！你的回合。'],
      cities: new Map(),
      selectedCityId: null,
      usedCityNames: new Set(),
    });
  },

  // 选择单位
  selectUnit: (unitId: string | null) => {
    set({ selectedUnitId: unitId });
  },

  // 移动单位
  moveUnit: (unitId: string, to: HexCoord): MoveResult => {
    const state = get();
    const unit = state.units.get(unitId);

    if (!unit) {
      return { unitId, from: { q: 0, r: 0 }, to, success: false, movementCost: 0 };
    }

    const cell = state.map.cells.get(coordKey(to));
    if (!cell) {
      return { unitId, from: unit.coord, to, success: false, movementCost: 0 };
    }

    const terrain = TERRAIN_PROPERTIES[cell.terrain];
    if (!terrain.passable) {
      return { unitId, from: unit.coord, to, success: false, movementCost: 0 };
    }

    // 检查是否有其他单位占据
    const occupyingUnit = Array.from(state.units.values()).find(
      u => coordKey(u.coord) === coordKey(to) && u.id !== unitId
    );
    if (occupyingUnit) {
      return { unitId, from: unit.coord, to, success: false, movementCost: 0 };
    }

    // 检查移动距离
    const distance = hexDistance(unit.coord, to);
    if (distance > unit.movementPoints) {
      return { unitId, from: unit.coord, to, success: false, movementCost: 0 };
    }

    // 执行移动
    const newUnits = new Map(state.units);
    newUnits.set(unitId, {
      ...unit,
      coord: to,
      movementPoints: unit.movementPoints - distance,
    });

    set({ units: newUnits });

    return {
      unitId,
      from: unit.coord,
      to,
      success: true,
      movementCost: distance,
    };
  },

  // 攻击单位
  attackUnit: (attackerId: string, defenderId: string): CombatResult | null => {
    const state = get();
    const attacker = state.units.get(attackerId);
    const defender = state.units.get(defenderId);

    if (!attacker || !defender) return null;
    if (attacker.hasAttacked) return null;

    const attackerStats = UNIT_STATS[attacker.type];
    const defenderStats = UNIT_STATS[defender.type];

    // 检查攻击范围
    const distance = hexDistance(attacker.coord, defender.coord);
    if (distance > attackerStats.range && distance > 1) return null;

    // 获取地形防御加成
    const defenderCell = state.map.cells.get(coordKey(defender.coord));
    const terrainBonus = defenderCell
      ? TERRAIN_PROPERTIES[defenderCell.terrain].defenseBonus
      : 0;

    // 计算伤害
    const baseDamage = 30;
    const attackPower = attackerStats.attack * (attacker.health / attackerStats.maxHealth);
    const defensePower = defenderStats.defense * (1 + terrainBonus) * (defender.health / defenderStats.maxHealth);

    const defenderDamage = Math.round(baseDamage * (attackPower / defensePower));
    const attackerDamage = Math.round(baseDamage * (defensePower / attackPower) * 0.5);

    const newHealth = defender.health - defenderDamage;
    const defenderKilled = newHealth <= 0;

    const attackerNewHealth = attacker.health - attackerDamage;
    const attackerKilled = attackerNewHealth <= 0;

    // 更新单位状态
    const newUnits = new Map(state.units);

    if (defenderKilled) {
      newUnits.delete(defenderId);
    } else {
      newUnits.set(defenderId, {
        ...defender,
        health: newHealth,
      });
    }

    if (attackerKilled) {
      newUnits.delete(attackerId);
    } else {
      newUnits.set(attackerId, {
        ...attacker,
        health: attackerNewHealth,
        hasAttacked: true,
        movementPoints: 0,
      });
    }

    // 检查游戏是否结束
    const { isOver, winner } = checkGameOver(Array.from(newUnits.values()), state.players);

    set({
      units: newUnits,
      selectedUnitId: null,
      phase: isOver ? GamePhase.GAME_OVER : state.phase,
      winner,
    });

    return {
      attackerId,
      defenderId,
      attackerDamage: attackerKilled ? attacker.health : attackerDamage,
      defenderDamage: defenderKilled ? defender.health : defenderDamage,
      defenderKilled,
      attackerKilled,
    };
  },

  // 结束回合
  endTurn: () => {
    const state = get();
    const currentPlayer = state.getCurrentPlayer();

    // 处理当前玩家的城市生产
    if (currentPlayer) {
      const playerCities = Array.from(state.cities.values())
        .filter(c => c.playerId === currentPlayer.id);

      const newUnits: Unit[] = [];
      const newCities = new Map(state.cities);
      const logs: string[] = [];

      playerCities.forEach(city => {
        // 处理生产队列
        if (city.productionQueue.length > 0) {
          const queueItem = city.productionQueue[0];
          queueItem.progress += city.resources.production;

          if (queueItem.progress >= queueItem.item.cost) {
            // 生产完成，创建单位
            const spawnCoord = findEmptyAdjacentCoord(city.coord, state);
            if (spawnCoord) {
              const unitType = queueItem.item.type as UnitType;
              const newUnit: Unit = {
                id: generateId(),
                type: unitType,
                playerId: city.playerId,
                coord: spawnCoord,
                health: UNIT_STATS[unitType].maxHealth,
                movementPoints: UNIT_STATS[unitType].movement,
                hasAttacked: false,
                isFortified: false,
              };
              newUnits.push(newUnit);
              logs.push(`${city.name} 完成了 ${queueItem.item.name} 的训练！`);
            }

            // 移除已完成的项目
            city.productionQueue.shift();
          }
        }

        // 处理人口增长
        city.growthProgress += city.resources.food;
        if (city.growthProgress >= getGrowthThreshold(city.population)) {
          city.population++;
          city.growthProgress = 0;
          logs.push(`${city.name} 的人口增长了！`);
        }

        // 重新计算资源（人口变化可能影响）
        city.resources = calculateCityResources(city.coord, state.map);
        newCities.set(city.id, { ...city });
      });

      // 添加新单位
      const updatedUnits = new Map(state.units);
      newUnits.forEach(u => updatedUnits.set(u.id, u));

      // 更新状态
      set({ cities: newCities, units: updatedUnits });

      // 添加日志
      logs.forEach(log => get().addLog(log));
    }

    // 切换到下一个玩家
    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    const nextPlayer = state.players[nextPlayerIndex];

    // 重置所有单位的行动点数和攻击状态
    const newUnits = new Map<string, Unit>();
    get().units.forEach((unit, id) => {
      newUnits.set(id, {
        ...unit,
        movementPoints: UNIT_STATS[unit.type].movement,
        hasAttacked: false,
        isFortified: false,
      });
    });

    // 增加回合数（如果是第一个玩家）
    const newTurn = nextPlayerIndex === 0 ? state.turn + 1 : state.turn;

    set({
      units: newUnits,
      currentPlayerIndex: nextPlayerIndex,
      turn: newTurn,
      selectedUnitId: null,
      selectedCityId: null,
      phase: nextPlayer.isAI ? GamePhase.AI_TURN : GamePhase.PLAYER_TURN,
    });

    // 如果是AI回合，执行AI逻辑
    if (nextPlayer.isAI) {
      // 使用setTimeout确保状态更新完成
      setTimeout(() => {
        executeAITurn();
      }, 500);
    }
  },

  // 建造城市
  foundCity: (settlerId: string) => {
    const state = get();
    const settler = state.units.get(settlerId);

    if (!settler || settler.type !== UnitType.SETTLER) return null;

    // 检查是否已有城市在同一位置
    const existingCity = Array.from(state.cities.values())
      .find(c => coordKey(c.coord) === coordKey(settler.coord));
    if (existingCity) return null;

    // 获取城市名称
    const cityName = getAvailableCityName(state.usedCityNames);

    // 创建城市
    const cityId = generateId();
    const city: City = {
      id: cityId,
      name: cityName,
      playerId: settler.playerId,
      coord: settler.coord,
      population: 1,
      resources: calculateCityResources(settler.coord, state.map),
      productionQueue: [],
      isCapital: !Array.from(state.cities.values())
        .some(c => c.playerId === settler.playerId),
      growthProgress: 0,
    };

    // 更新状态
    const newCities = new Map(state.cities);
    newCities.set(cityId, city);

    // 更新地图单元格
    const cellKey = coordKey(settler.coord);
    const newCells = new Map(state.map.cells);
    const cell = newCells.get(cellKey);
    if (cell) {
      newCells.set(cellKey, { ...cell, cityId });
    }

    // 移除殖民者单位
    const newUnits = new Map(state.units);
    newUnits.delete(settlerId);

    // 更新已使用的城市名称
    const newUsedNames = new Set(state.usedCityNames);
    newUsedNames.add(cityName);

    set({
      cities: newCities,
      units: newUnits,
      map: { ...state.map, cells: newCells },
      usedCityNames: newUsedNames,
      selectedUnitId: null,
    });

    get().addLog(`建立了城市 ${cityName}！`);
    return city;
  },

  // 选择城市
  selectCity: (cityId: string | null) => {
    set({ selectedCityId: cityId, selectedUnitId: null });
  },

  // 添加到生产队列
  addToProductionQueue: (cityId: string, itemType: ProducableType) => {
    const state = get();
    const city = state.cities.get(cityId);
    if (!city) return;

    const item = PRODUCTION_ITEMS.find(i => i.type === itemType);
    if (!item) return;

    const queueItem = {
      id: generateId(),
      item,
      progress: 0,
    };

    const newCities = new Map(state.cities);
    newCities.set(cityId, {
      ...city,
      productionQueue: [...city.productionQueue, queueItem],
    });

    set({ cities: newCities });
    get().addLog(`${city.name} 开始训练 ${item.name}`);
  },

  // 从生产队列移除
  removeFromProductionQueue: (cityId: string, queueItemId: string) => {
    const state = get();
    const city = state.cities.get(cityId);
    if (!city) return;

    const newCities = new Map(state.cities);
    newCities.set(cityId, {
      ...city,
      productionQueue: city.productionQueue.filter(item => item.id !== queueItemId),
    });

    set({ cities: newCities });
  },

  // 获取坐标上的城市
  getCityAtCoord: (coord: HexCoord) => {
    const key = coordKey(coord);
    return Array.from(get().cities.values()).find(c => coordKey(c.coord) === key);
  },

  // 获取玩家的所有城市
  getPlayerCities: (playerId: string) => {
    return Array.from(get().cities.values()).filter(c => c.playerId === playerId);
  },

  // 获取当前玩家
  getCurrentPlayer: () => {
    const state = get();
    return state.players[state.currentPlayerIndex];
  },

  // 获取玩家的所有单位
  getPlayerUnits: (playerId: string) => {
    return Array.from(get().units.values()).filter(u => u.playerId === playerId);
  },

  // 获取坐标上的单位
  getUnitAtCoord: (coord: HexCoord) => {
    const key = coordKey(coord);
    return Array.from(get().units.values()).find(u => coordKey(u.coord) === key);
  },

  // 获取单位可移动的坐标
  getMovableCoords: (unitId: string) => {
    const state = get();
    const unit = state.units.get(unitId);
    if (!unit) return new Set();

    const movable = new Set<string>();
    const visited = new Set<string>();
    const queue: Array<{ coord: HexCoord; cost: number }> = [{ coord: unit.coord, cost: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentKey = coordKey(current.coord);

      if (visited.has(currentKey)) continue;
      visited.add(currentKey);

      if (current.cost > 0) {
        // 检查是否有单位占据
        const occupyingUnit = Array.from(state.units.values()).find(
          u => coordKey(u.coord) === currentKey
        );
        if (occupyingUnit) continue;

        movable.add(currentKey);
      }

      // 继续探索邻居
      if (current.cost < unit.movementPoints) {
        hexNeighbors(current.coord).forEach(neighbor => {
          const cell = state.map.cells.get(coordKey(neighbor));
          if (!cell) return;

          const terrain = TERRAIN_PROPERTIES[cell.terrain];
          if (!terrain.passable) return;

          const newCost = current.cost + terrain.movementCost;
          if (newCost <= unit.movementPoints) {
            queue.push({ coord: neighbor, cost: newCost });
          }
        });
      }
    }

    return movable;
  },

  // 获取单位可攻击的坐标
  getAttackableCoords: (unitId: string) => {
    const state = get();
    const unit = state.units.get(unitId);
    if (!unit || unit.hasAttacked) return new Set();

    const unitStats = UNIT_STATS[unit.type];
    const attackRange = Math.max(unitStats.range, 1);
    const attackable = new Set<string>();

    // 检查攻击范围内的所有格子
    for (const target of state.units.values()) {
      if (target.playerId === unit.playerId) continue;

      const distance = hexDistance(unit.coord, target.coord);
      if (distance <= attackRange) {
        attackable.add(coordKey(target.coord));
      }
    }

    return attackable;
  },

  // 设置悬停坐标
  setHoveredCoord: (coord: HexCoord | null) => {
    set({ hoveredCoord: coord });
  },

  // 添加日志
  addLog: (message: string) => {
    set(state => ({
      gameLog: [...state.gameLog.slice(-19), message],
    }));
  },
}));
