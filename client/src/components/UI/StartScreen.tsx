import { useState } from 'react';

interface StartScreenProps {
  onStartGame: () => void;
}

export default function StartScreen({ onStartGame }: StartScreenProps) {
  const [mapWidth, setMapWidth] = useState(20);
  const [mapHeight, setMapHeight] = useState(15);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-game-bg to-game-panel">
      {/* 标题 */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
          文明战棋
        </h1>
        <p className="text-xl text-gray-300">Web版回合制策略游戏</p>
      </div>

      {/* 设置面板 */}
      <div className="game-panel p-8 w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          游戏设置
        </h2>

        {/* 地图大小设置 */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">地图宽度: {mapWidth}</label>
          <input
            type="range"
            min="10"
            max="30"
            value={mapWidth}
            onChange={(e) => setMapWidth(Number(e.target.value))}
            className="w-full h-2 bg-game-accent rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="mb-8">
          <label className="block text-gray-300 mb-2">地图高度: {mapHeight}</label>
          <input
            type="range"
            min="8"
            max="20"
            value={mapHeight}
            onChange={(e) => setMapHeight(Number(e.target.value))}
            className="w-full h-2 bg-game-accent rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* 玩家信息 */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between p-3 bg-game-bg rounded-lg">
            <span className="text-gray-300">玩家</span>
            <span className="text-blue-400 font-bold">人类</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-game-bg rounded-lg">
            <span className="text-gray-300">对手</span>
            <span className="text-red-400 font-bold">AI</span>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={onStartGame}
          className="w-full py-4 bg-gradient-to-r from-game-highlight to-red-600 text-white text-xl font-bold rounded-lg hover:from-red-600 hover:to-game-highlight transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          开始游戏
        </button>
      </div>

      {/* 游戏说明 */}
      <div className="mt-8 text-center text-gray-400 max-w-md">
        <p className="mb-2">点击单位选中，点击高亮格子移动或攻击</p>
        <p>消灭所有敌方单位获得胜利！</p>
      </div>
    </div>
  );
}
