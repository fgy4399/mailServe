# 🐳 Docker 部署指南

## 快速部署

```bash
# 1. 解压项目
tar -xzf mailServe-v2.4.tar.gz
cd mailServe

# 2. 运行 Docker 部署脚本
chmod +x docker-deploy.sh
./docker-deploy.sh
```

## 手动部署

```bash
# 1. 创建 .env 配置
cat > .env << EOF
EMAIL_DOMAINS=mail.example.com,inbox.test.com
EMAIL_DEFAULT_DOMAIN=mail.example.com
EMAIL_TTL=3600
VITE_API_URL=http://你的服务器IP:3000
VITE_WS_URL=ws://你的服务器IP:3001
EOF

# 2. 构建并启动
docker compose up -d --build

# 3. 查看状态
docker compose ps
docker compose logs -f
```

## 常用命令

```bash
docker compose ps           # 查看状态
docker compose logs -f      # 查看日志
docker compose restart      # 重启服务
docker compose down         # 停止服务
docker compose up -d        # 启动服务
```

## 端口说明

| 端口 | 服务 |
|------|------|
| 80 | 前端 Web 界面 |
| 3000 | 后端 API |
| 3001 | WebSocket |
| 25 | SMTP 邮件接收 |

## 修改配置

编辑 `.env` 文件后重新构建：
```bash
docker compose down
docker compose up -d --build
```

## 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 开放端口: 80, 3000, 3001, 25
