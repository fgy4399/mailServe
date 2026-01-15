# =============================================
# mailServe All-in-One Docker 镜像
# 包含：后端 API + SMTP + WebSocket + 前端
# =============================================

# ========== 阶段1: 构建前端 ==========
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# 复制前端文件
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# 构建参数（可在构建时覆盖）
ARG VITE_API_URL=
ARG VITE_WS_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# ========== 阶段2: 生产镜像 ==========
FROM node:20-alpine

# 安装 Nginx 和 Supervisor
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# 复制后端
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src

# 复制前端构建产物
COPY --from=frontend-builder /frontend/dist /var/www/html

# 复制 Nginx 配置
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# 复制 Supervisor 配置
COPY docker/supervisord.conf /etc/supervisord.conf

# 创建日志目录
RUN mkdir -p /var/log/supervisor

# 暴露端口
EXPOSE 80 25 3001

# 环境变量默认值
ENV NODE_ENV=production \
    PORT=3000 \
    SMTP_PORT=25 \
    WS_PORT=3001 \
    TRUST_PROXY=1 \
    REDIS_HOST=redis \
    REDIS_PORT=6379 \
    EMAIL_DOMAINS=temp-mail.local \
    EMAIL_DEFAULT_DOMAIN=temp-mail.local \
    EMAIL_TTL=3600 \
    CORS_ORIGIN=*

# 启动 Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
