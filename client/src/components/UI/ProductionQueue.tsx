import { ProductionQueueItem } from 'shared';

interface ProductionQueueProps {
  queue: ProductionQueueItem[];
  onRemove: (id: string) => void;
}

export default function ProductionQueue({ queue, onRemove }: ProductionQueueProps) {
  if (queue.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 bg-game-bg/50 rounded-lg">
        当前没有生产项目
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {queue.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 p-3 bg-game-bg rounded-lg border transition-all
            ${index === 0
              ? 'border-game-highlight shadow-lg shadow-game-highlight/20'
              : 'border-game-accent/30 opacity-80'
            }`}
        >
          {/* 图标 */}
          <span className="text-2xl">{item.item.icon}</span>

          {/* 名称和进度 */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white font-medium truncate">{item.item.name}</span>
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                {item.progress}/{item.item.cost}
              </span>
            </div>

            {/* 进度条 */}
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full
                  ${index === 0
                    ? 'bg-gradient-to-r from-game-highlight to-red-500'
                    : 'bg-game-accent'
                  }`}
                style={{ width: `${(item.progress / item.item.cost) * 100}%` }}
              />
            </div>
          </div>

          {/* 移除按钮 */}
          <button
            onClick={() => onRemove(item.id)}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
