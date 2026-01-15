# 📧 mailServe - 临时邮箱服务

一个自托管的临时邮箱服务，支持自定义域名、实时邮件推送和 Web 界面管理。

## ✨ 功能特性

- 🎯 **自定义域名** - 支持多域名配置
- 📬 **SMTP 接收** - 内置 SMTP 服务器接收邮件
- ⚡ **实时推送** - WebSocket 实时通知新邮件
- 🎨 **现代 UI** - 美观的 Web 管理界面
- ⏰ **自动过期** - 邮箱自动过期清理
- 📎 **附件支持** - 支持邮件附件下载

## 🚀 快速部署

### 1. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    container_name: mailserve-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - mailserve-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  mailserve:
    image: fgy1/mailserve:latest
    container_name: mailserve-app
    restart: unless-stopped
    ports:
      - "80:80"      # Web 界面 + API
      - "25:25"      # SMTP
      - "3001:3001"  # WebSocket
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - EMAIL_DOMAINS=your-domain.com
      - EMAIL_DEFAULT_DOMAIN=your-domain.com
      - EMAIL_TTL=3600
      - CORS_ORIGIN=*
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - mailserve-network

networks:
  mailserve-network:
    driver: bridge

volumes:
  redis-data:
```

### 2. 启动服务

```bash
docker compose up -d
```

### 3. 访问服务

- **Web 界面**: `http://your-server-ip`
- **API**: `http://your-server-ip/api`

## ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `REDIS_HOST` | Redis 地址 | redis |
| `REDIS_PORT` | Redis 端口 | 6379 |
| `EMAIL_DOMAINS` | 邮箱域名（多个用逗号分隔） | temp-mail.local |
| `EMAIL_DEFAULT_DOMAIN` | 默认域名 | temp-mail.local |
| `EMAIL_TTL` | 邮箱有效期（秒） | 3600 |
| `CORS_ORIGIN` | CORS 跨域设置 | * |

## 🌐 端口说明

| 端口 | 服务 |
|------|------|
| 80 | Web 界面 + API（Nginx 代理） |
| 25 | SMTP 邮件接收 |
| 3001 | WebSocket 实时推送 |

## 📋 DNS 配置

配置域名的 MX 记录指向你的服务器：

```
类型: MX
名称: @
值: mail.your-domain.com
优先级: 10

类型: A
名称: mail
值: 你的服务器IP
```

## 🔧 常用命令

```bash
# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新镜像
docker compose pull && docker compose up -d
```

## 📄 开源协议

MIT License
