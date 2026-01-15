# mailServe（临时邮箱服务）

自托管的临时邮箱服务：自定义域名、SMTP 收信、WebSocket 实时推送、Web 界面查看/下载附件，邮箱与邮件在 Redis 中按 TTL 自动过期清理。

## 功能特性

- 多域名：`EMAIL_DOMAINS` 支持逗号分隔多个域名
- 一体化：单容器包含前端 + API + WebSocket（Nginx 反代）
- 自动过期：邮箱与邮件按 `EMAIL_TTL` 自动清理
- 实时通知：新邮件通过 WebSocket 推送到页面

## 快速开始（Docker Compose）

```bash
# 可选：复制并编辑环境变量
cp backend/.env.example backend/.env

# 直接使用仓库自带 docker-compose.yml 启动
docker compose up -d --build
```

访问：

- Web/UI + API：`http://<server-ip>/`（API 前缀为 `/api`）
- WebSocket：`ws://<server-ip>/ws`

## 配置说明

推荐通过 `docker-compose.yml` 环境变量覆盖：

- `EMAIL_DOMAINS`：可用域名列表（例：`mail.example.com,inbox.example.com`）
- `EMAIL_DEFAULT_DOMAIN`：默认域名（不填则取 `EMAIL_DOMAINS` 第一个）
- `EMAIL_TTL`：邮箱与邮件有效期（秒，默认 `3600`）
- `HTTP_PORT`：对外 Web 端口（默认 `80`）
- `SMTP_PORT`：对外 SMTP 端口（默认 `25`）
- `CORS_ORIGIN`：跨域允许来源（默认 `*`）
- `TRUST_PROXY`：反代层数（Docker 内默认 `1`，用于正确读取 `X-Forwarded-For`）

## 本地开发（非 Docker）

```bash
# 1) 启动 Redis（示例：本机 6379）

# 2) 后端（API + SMTP + WS）
cd backend
cp .env.example .env
npm ci
npm run dev

# 3) 前端（Vite）
cd ../frontend
cp .env.example .env
npm ci
npm run dev
```

默认端口：前端 `5173`、API `3000`、WebSocket `3001`、SMTP `2525`（可在 `backend/.env` 调整）。

## DNS（自定义域名）

将域名的 MX 记录指向你的 SMTP 主机（示例）：

```
MX  @    mail.example.com   10
A   mail <server-ip>
```

## 常用命令

```bash
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
```

## 安全提示

- 邮件 HTML 在前端会做基础清理，但仍建议不要用于接收敏感信息。
- 大附件会显著增加 Redis 占用；生产环境建议限制邮件大小/附件大小。
