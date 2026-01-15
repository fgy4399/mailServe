import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { redisClient } from './utils/redis.js';
import { WebSocketService } from './utils/websocket.js';
import { MailServer } from './smtp/server.js';
import routes from './api/routes.js';
import { config } from './config/index.js';

const app = express();

// 反向代理支持（用于正确读取 X-Forwarded-For）
if (config.trustProxy) {
  app.set('trust proxy', config.trustProxy);
}

// CORS 配置
app.use(cors({
  origin: config.cors.origin === '*' ? true : config.cors.origin,
  credentials: config.cors.origin === '*' ? false : true,
}));

// 安全中间件
app.use(helmet());

// 请求体解析
app.use(express.json());

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
});
app.use('/api/', limiter);

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

// 启动服务
async function start() {
  try {
    // 连接 Redis
    await redisClient.connect();

    // 启动 WebSocket 服务
    const wsServer = new WebSocketService(config.wsPort);
    wsServer.start();

    // 启动 SMTP 服务
    const mailServer = new MailServer(wsServer.wss);
    mailServer.start();

    // 启动 HTTP 服务
    app.listen(config.port, () => {
      console.log(`🚀 HTTP Server listening on port ${config.port}`);
      console.log(`📧 Email domain: ${config.email.domain}`);
      console.log(`⏰ Email TTL: ${config.email.ttl} seconds`);
      console.log('');
      console.log('✅ All services started successfully!');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
