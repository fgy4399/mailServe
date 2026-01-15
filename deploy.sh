#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     📧 mailServe - 临时邮箱服务 一键部署脚本               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

[ "$EUID" -ne 0 ] && { print_error "请使用 root 用户运行"; exit 1; }

print_info "更新系统包..."
apt-get update -y
apt-get install -y curl wget git

if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    print_info "安装 Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

if ! command -v docker &> /dev/null; then
    print_info "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker && systemctl start docker
fi

command -v pm2 &> /dev/null || npm install -g pm2
npm install -g serve

SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "YOUR_SERVER_IP")
echo ""
read -p "请输入邮箱域名 (多个用逗号分隔): " EMAIL_DOMAINS
EMAIL_DOMAINS=${EMAIL_DOMAINS:-temp-mail.local}
DEFAULT_DOMAIN=$(echo $EMAIL_DOMAINS | cut -d',' -f1)
read -p "SMTP 端口 [默认: 25]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-25}

cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
SMTP_PORT=${SMTP_PORT}
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_DOMAINS=${EMAIL_DOMAINS}
EMAIL_DEFAULT_DOMAIN=${DEFAULT_DOMAIN}
EMAIL_TTL=3600
CORS_ORIGIN=*
WS_PORT=3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

cat > frontend/.env << EOF
VITE_API_URL=http://${SERVER_IP}:3000
VITE_WS_URL=ws://${SERVER_IP}:3001
EOF

print_info "启动 Redis..."
docker ps -a | grep -q mailserve-redis && docker start mailserve-redis || docker run -d --name mailserve-redis --restart unless-stopped -p 6379:6379 redis:alpine
sleep 2

print_info "安装后端依赖..."
cd backend && npm install && cd ..

print_info "安装前端依赖并构建..."
cd frontend && npm install && npm run build && cd ..

pm2 delete all 2>/dev/null || true
cd backend && pm2 start src/index.js --name mailserve-backend && cd ..
cd frontend && pm2 start "serve -s dist -l 5173" --name mailserve-frontend && cd ..
pm2 save

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp; ufw allow 25/tcp; ufw allow 3000/tcp; ufw allow 3001/tcp; ufw allow 5173/tcp
    ufw --force enable 2>/dev/null || true
fi

echo ""
print_success "🎉 部署成功！"
echo "前端地址: http://${SERVER_IP}:5173"
echo "API 地址: http://${SERVER_IP}:3000"
echo "SMTP 端口: ${SMTP_PORT}"
echo ""
echo "常用命令: pm2 status | pm2 logs | pm2 restart all"
