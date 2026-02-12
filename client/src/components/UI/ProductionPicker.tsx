import { ProducableType, PRODUCTION_ITEMS } from 'shared';

interface ProductionPickerProps {
  onSelect: (type: ProducableType) => void;
  onClose: () => void;
}

export default function ProductionPicker({ onSelect, onClose }: ProductionPickerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
      <div className="bg-game-panel rounded-xl shadow-2xl border border-game-accent p-6 min-w-[320px] animate-bounce-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">选择生产项目</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {PRODUCTION_ITEMS.map((item) => (
            <button
              key={item.type}
              onClick={() => onSelect(item.type)}
              className="w-full flex items-center gap-4 p-4 bg-game-bg rounded-lg
                         border border-game-accent/30 hover:border-game-highlight
                         hover:bg-game-accent/30 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <div className="flex-1 text-left">
                <div className="text-white font-bold">{item.name}</div>
                <div className="text-sm text-gray-400">
                  成本: {item.cost} 生产力
                </div>
              </div>
              <span className="text-game-highlight opacity-0 group-hover:opacity-100 transition-opacity">
                选择 →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
