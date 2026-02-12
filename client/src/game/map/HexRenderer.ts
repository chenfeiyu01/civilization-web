import {
  HexCoord,
  HexCell,
  TERRAIN_PROPERTIES,
} from 'shared';

export interface HexRenderConfig {
  hexSize: number;
  offsetX: number;
  offsetY: number;
}

// 获取六边形的顶点坐标
export function getHexCorners(center: { x: number; y: number }, size: number): Array<{ x: number; y: number }> {
  const corners: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    corners.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    });
  }
  return corners;
}

// Axial坐标转像素坐标（pointy-top六边形）
export function hexToPixel(coord: HexCoord, config: HexRenderConfig): { x: number; y: number } {
  const { hexSize, offsetX, offsetY } = config;
  const x = hexSize * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r) + offsetX;
  const y = hexSize * (3 / 2) * coord.r + offsetY;
  return { x, y };
}

// 像素坐标转Axial坐标
export function pixelToHex(x: number, y: number, config: HexRenderConfig): HexCoord {
  const { hexSize, offsetX, offsetY } = config;
  const px = x - offsetX;
  const py = y - offsetY;

  const q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / hexSize;
  const r = (2 / 3 * py) / hexSize;

  return hexRound({ q, r });
}

// 六边形坐标四舍五入
function hexRound(coord: { q: number; r: number }): HexCoord {
  const s = -coord.q - coord.r;

  let q = Math.round(coord.q);
  let r = Math.round(coord.r);
  let sRounded = Math.round(s);

  const qDiff = Math.abs(q - coord.q);
  const rDiff = Math.abs(r - coord.r);
  const sDiff = Math.abs(sRounded - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - sRounded;
  } else if (rDiff > sDiff) {
    r = -q - sRounded;
  }

  return { q, r };
}

// 渲染单个六边形
export function renderHex(
  ctx: CanvasRenderingContext2D,
  cell: HexCell,
  config: HexRenderConfig,
  options: {
    highlight?: boolean;
    selected?: boolean;
    movable?: boolean;
    attackable?: boolean;
  } = {}
): void {
  const center = hexToPixel(cell.coord, config);
  const corners = getHexCorners(center, config.hexSize);
  const terrain = TERRAIN_PROPERTIES[cell.terrain];

  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();

  // 填充地形颜色
  ctx.fillStyle = terrain.color;
  ctx.fill();

  // 绘制边框
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 高亮效果
  if (options.highlight) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
  }

  // 选中效果
  if (options.selected) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 可移动效果
  if (options.movable) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 可攻击效果
  if (options.attackable) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// 渲染六边形网格
export function renderHexGrid(
  ctx: CanvasRenderingContext2D,
  cells: Map<string, HexCell>,
  config: HexRenderConfig,
  options: {
    highlightedCoords?: Set<string>;
    selectedCoord?: string | null;
    movableCoords?: Set<string>;
    attackableCoords?: Set<string>;
  } = {}
): void {
  cells.forEach((cell, key) => {
    renderHex(ctx, cell, config, {
      highlight: options.highlightedCoords?.has(key),
      selected: options.selectedCoord === key,
      movable: options.movableCoords?.has(key),
      attackable: options.attackableCoords?.has(key),
    });
  });
}

// 计算地图边界
export function calculateMapBounds(
  cells: Map<string, HexCell>,
  hexSize: number
): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  cells.forEach(cell => {
    const center = hexToPixel(cell.coord, { hexSize, offsetX: 0, offsetY: 0 });
    minX = Math.min(minX, center.x - hexSize);
    maxX = Math.max(maxX, center.x + hexSize);
    minY = Math.min(minY, center.y - hexSize);
    maxY = Math.max(maxY, center.y + hexSize);
  });

  return { minX, maxX, minY, maxY };
}
