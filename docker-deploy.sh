#!/bin/bash

#############################################
#  mailServe Docker 部署脚本
#############################################

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     📧 mailServe - Docker 一键部署脚本                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "YOUR_SERVER_IP")

echo ""
echo "==========================================="
echo "  请配置邮箱服务参数"
echo "==========================================="
echo ""

# 获取配置
read -p "请输入邮箱域名 (多个用逗号分隔，如: mail.example.com): " EMAIL_DOMAINS
EMAIL_DOMAINS=${EMAIL_DOMAINS:-temp-mail.local}

DEFAULT_DOMAIN=$(echo $EMAIL_DOMAINS | cut -d',' -f1)
read -p "默认域名 [默认: $DEFAULT_DOMAIN]: " EMAIL_DEFAULT_DOMAIN
EMAIL_DEFAULT_DOMAIN=${EMAIL_DEFAULT_DOMAIN:-$DEFAULT_DOMAIN}

read -p "邮箱有效期(秒) [默认: 3600]: " EMAIL_TTL
EMAIL_TTL=${EMAIL_TTL:-3600}

# 创建 .env 文件
cat > .env << EOF
# 邮箱配置
EMAIL_DOMAINS=${EMAIL_DOMAINS}
EMAIL_DEFAULT_DOMAIN=${EMAIL_DEFAULT_DOMAIN}
EMAIL_TTL=${EMAIL_TTL}

# 前端 API 地址
VITE_API_URL=http://${SERVER_IP}:3000
VITE_WS_URL=ws://${SERVER_IP}:3001
EOF

print_info "配置已保存到 .env 文件"
echo ""
cat .env
echo ""

# 停止旧容器
print_info "停止旧容器..."
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

# 构建并启动
print_info "构建 Docker 镜像..."
docker compose build --no-cache 2>/dev/null || docker-compose build --no-cache

print_info "启动服务..."
docker compose up -d 2>/dev/null || docker-compose up -d

# 等待服务启动
sleep 5

# 检查服务状态
print_info "检查服务状态..."
docker compose ps 2>/dev/null || docker-compose ps

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     🎉 mailServe Docker 部署成功！                         ║"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "  📧 前端地址: http://${SERVER_IP}"
echo "  🔌 API 地址: http://${SERVER_IP}:3000"
echo "  📮 SMTP 端口: 25"
echo "  📧 邮箱域名: ${EMAIL_DOMAINS}"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "  常用命令:"
echo "    查看日志: docker compose logs -f"
echo "    重启服务: docker compose restart"
echo "    停止服务: docker compose down"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
