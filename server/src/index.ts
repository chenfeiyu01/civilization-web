import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 游戏相关API（预留用于未来扩展）
app.get('/api/game/state', (req, res) => {
  res.json({ message: 'Game state endpoint - to be implemented' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎮 游戏服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 API端点: /api/*`);
});
