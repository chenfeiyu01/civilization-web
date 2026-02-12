import { useRef, useEffect, useCallback, useState } from 'react';
import { HexCoord, coordKey, UNIT_DISPLAY, UNIT_STATS } from 'shared';
import { renderHexGrid, hexToPixel, pixelToHex, HexRenderConfig } from '../../game/map/HexRenderer';
import { animationManager, particleEngine } from '../../game/animation';
import { useGameStore } from '../../store/gameStore';

interface HexCanvasProps {
  onCellClick: (coord: HexCoord) => void;
  onCellHover: (coord: HexCoord | null) => void;
}

export default function HexCanvas({ onCellClick, onCellHover }: HexCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [config, setConfig] = useState<HexRenderConfig>({
    hexSize: 40,
    offsetX: 100,
    offsetY: 100,
  });

  const {
    map,
    units,
    cities,
    players,
    selectedUnitId,
    selectedCityId,
    hoveredCoord,
    getMovableCoords,
    getAttackableCoords,
  } = useGameStore();

  const movableCoords: Set<string> = selectedUnitId ? getMovableCoords(selectedUnitId) : new Set();
  const attackableCoords: Set<string> = selectedUnitId ? getAttackableCoords(selectedUnitId) : new Set();

  // 绘制地图
  const draw = useCallback((_time: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制六边形网格
    renderHexGrid(ctx, map.cells, config, {
      selectedCoord: selectedUnitId
        ? coordKey(units.get(selectedUnitId)?.coord || { q: 0, r: 0 })
        : null,
      movableCoords,
      attackableCoords,
      highlightedCoords: hoveredCoord ? new Set([coordKey(hoveredCoord)]) : undefined,
    });

    // 绘制粒子（在单位和城市下面）
    particleEngine.render(ctx);

    // 绘制动画
    animationManager.render(ctx, config);

    // 绘制城市
    cities.forEach((city) => {
      const center = hexToPixel(city.coord, config);
      const player = players.find(p => p.id === city.playerId);
      const isSelected = selectedCityId === city.id;

      // 绘制城市背景
      ctx.beginPath();
      ctx.arc(center.x, center.y, config.hexSize * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = player?.color || '#ffffff';
      ctx.fill();

      // 绘制边框（选中时高亮）
      ctx.strokeStyle = isSelected ? '#FFD700' : (city.isCapital ? '#FFD700' : '#ffffff');
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.stroke();

      // 绘制城市图标
      ctx.font = `${config.hexSize * 0.8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(city.isCapital ? '🏛️' : '🏠', center.x, center.y);

      // 绘制城市名称
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(city.name, center.x, center.y + config.hexSize * 0.85);
      ctx.fillText(city.name, center.x, center.y + config.hexSize * 0.85);

      // 绘制人口
      ctx.font = '10px Arial';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`👥${city.population}`, center.x, center.y + config.hexSize * 1.0);
    });

    // 绘制单位
    units.forEach((unit) => {
      const center = hexToPixel(unit.coord, config);
      const display = UNIT_DISPLAY[unit.type];

      // 绘制单位背景圆
      ctx.beginPath();
      ctx.arc(center.x, center.y, config.hexSize * 0.5, 0, Math.PI * 2);

      // 获取单位所属玩家的颜色
      const player = players.find(p => p.id === unit.playerId);
      ctx.fillStyle = player?.color || '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制单位符号
      ctx.font = `${config.hexSize * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(display.symbol, center.x, center.y);

      // 绘制血量条
      const healthRatio = unit.health / UNIT_STATS[unit.type].maxHealth;
      const barWidth = config.hexSize * 0.8;
      const barHeight = 4;
      const barX = center.x - barWidth / 2;
      const barY = center.y + config.hexSize * 0.6;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = healthRatio > 0.5 ? '#22c55e' : healthRatio > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
    });
  }, [map, units, cities, players, config, selectedUnitId, selectedCityId, movableCoords, attackableCoords, hoveredCoord]);

  // 动画循环
  useEffect(() => {
    const animate = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // 更新动画和粒子
      animationManager.update(deltaTime);
      particleEngine.update(deltaTime);

      // 绘制
      draw(time);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  // 处理画布大小变化
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 鼠标点击处理
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const coord = pixelToHex(x, y, config);
    onCellClick(coord);
  }, [config, onCellClick]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const coord = pixelToHex(x, y, config);

    // 检查坐标是否在地图范围内
    if (map.cells.has(coordKey(coord))) {
      onCellHover(coord);
    } else {
      onCellHover(null);
    }
  }, [config, map.cells, onCellHover]);

  // 鼠标离开处理
  const handleMouseLeave = useCallback(() => {
    onCellHover(null);
  }, [onCellHover]);

  // 拖拽平移
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) { // 右键拖拽
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      setIsDragging(false);
    }
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setConfig(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      handleMouseMove(e);
    }
  }, [isDragging, dragStart, handleMouseMove]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newSize = Math.max(20, Math.min(80, config.hexSize * scaleFactor));

    setConfig(prev => ({
      ...prev,
      hexSize: newSize,
    }));
  }, [config.hexSize]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleDragMove}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair"
      />

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 space-y-1">
        <div>左键: 选择/移动/攻击</div>
        <div>右键拖拽: 平移地图</div>
        <div>滚轮: 缩放</div>
      </div>
    </div>
  );
}
