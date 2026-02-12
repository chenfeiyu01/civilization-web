import { useState } from 'react';
import { City } from 'shared';
import { useGameStore } from '../../store/gameStore';
import ProductionQueue from './ProductionQueue';
import ProductionPicker from './ProductionPicker';

interface CityPanelProps {
  city: City;
  onClose: () => void;
}

export default function CityPanel({ city, onClose }: CityPanelProps) {
  const { addToProductionQueue, removeFromProductionQueue } = useGameStore();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                    bg-gradient-to-b from-game-panel to-game-bg rounded-xl shadow-2xl
                    border-2 border-game-accent p-6 z-20 min-w-[360px] animate-bounce-in">
      {/* 城市头部 */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-game-accent">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{city.isCapital ? '🏛️' : '🏠'}</span>
            {city.name}
          </h2>
          {city.isCapital && (
            <span className="text-xs text-yellow-400">首都</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* 人口 */}
      <div className="mb-4 flex items-center gap-2 text-gray-300">
        <span>👥</span>
        <span>人口: {city.population}</span>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{
              width: `${(city.growthProgress / (15 + city.population * 10 + city.population * city.population * 2)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* 资源显示 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex flex-col items-center p-3 bg-game-bg rounded-lg border border-game-accent/30">
          <span className="text-2xl">🌾</span>
          <span className="text-lg font-bold text-green-400">+{city.resources.food}</span>
          <span className="text-xs text-gray-400">食物</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-game-bg rounded-lg border border-game-accent/30">
          <span className="text-2xl">⚙️</span>
          <span className="text-lg font-bold text-yellow-400">+{city.resources.production}</span>
          <span className="text-xs text-gray-400">生产力</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-game-bg rounded-lg border border-game-accent/30">
          <span className="text-2xl">💰</span>
          <span className="text-lg font-bold text-amber-400">+{city.resources.gold}</span>
          <span className="text-xs text-gray-400">金币</span>
        </div>
      </div>

      {/* 生产队列 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-white">生产队列</h3>
          <button
            onClick={() => setShowPicker(true)}
            className="px-3 py-1 text-sm bg-game-accent hover:bg-game-highlight
                       text-white rounded-lg transition-colors"
          >
            + 添加
          </button>
        </div>
        <ProductionQueue
          queue={city.productionQueue}
          onRemove={(id) => removeFromProductionQueue(city.id, id)}
        />
      </div>

      {/* 生产选择器 */}
      {showPicker && (
        <ProductionPicker
          onSelect={(type) => {
            addToProductionQueue(city.id, type);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
