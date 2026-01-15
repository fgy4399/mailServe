#!/bin/bash

#############################################
#  推送 mailServe 到 Docker Hub
#  当前架构版本
#############################################

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取当前架构
CURRENT_ARCH=$(uname -m)
if [ "$CURRENT_ARCH" = "aarch64" ]; then
    PLATFORM="linux/arm64"
    ARCH_TAG="arm64"
else
    PLATFORM="linux/amd64"
    ARCH_TAG="amd64"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🐳 推送 mailServe 到 Docker Hub                        ║"
echo "║     当前架构: $ARCH_TAG                                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 获取 Docker Hub 用户名
read -p "请输入 Docker Hub 用户名: " DOCKER_USERNAME
if [ -z "$DOCKER_USERNAME" ]; then
    print_error "用户名不能为空"
    exit 1
fi

# 镜像名称
IMAGE_NAME="mailserve"
read -p "镜像名称 [默认: $IMAGE_NAME]: " INPUT_NAME
IMAGE_NAME=${INPUT_NAME:-$IMAGE_NAME}

# 版本标签
read -p "版本标签 [默认: latest]: " VERSION
VERSION=${VERSION:-latest}

FULL_IMAGE="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
ARCH_IMAGE="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}-${ARCH_TAG}"

print_info "构建镜像: $FULL_IMAGE"
print_info "架构: $PLATFORM"
echo ""

# 登录 Docker Hub
print_info "登录 Docker Hub..."
docker login

# 普通构建
print_info "构建镜像..."
docker build -t $FULL_IMAGE -t $ARCH_IMAGE .

# 推送镜像
print_info "推送镜像..."
docker push $FULL_IMAGE
docker push $ARCH_IMAGE

echo ""
print_success "🎉 推送成功！"
echo ""
echo "镜像地址:"
echo "  docker.io/$FULL_IMAGE"
echo "  docker.io/$ARCH_IMAGE"
echo ""
echo "使用方法:"
echo "  docker pull $FULL_IMAGE"
echo ""
print_info "提示: 如需 AMD64 版本，请在 x86 服务器上运行此脚本"
