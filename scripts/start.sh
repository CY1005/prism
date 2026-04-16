#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# 1. 检查 .env
if [ ! -f .env ]; then
    warn ".env 不存在，正在从 .env.example 生成..."
    cp .env.example .env
    # 自动填充密钥
    sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -base64 33)|" .env
    sed -i "s|^AI_KEY_ENCRYPTION_SECRET=.*|AI_KEY_ENCRYPTION_SECRET=$(openssl rand -hex 32)|" .env
    sed -i "s|^INTERNAL_TOKEN=.*|INTERNAL_TOKEN=$(openssl rand -hex 16)|" .env
    info ".env 已生成并填充密钥"
else
    info ".env 已存在"
fi

# 2. 启动全部 Docker 服务 (PostgreSQL + FastAPI + Next.js)
info "启动 Docker 服务..."
DOCKER_BUILDKIT=0 docker compose up -d --build --pull=false

# 等待所有服务就绪
echo -n "等待服务就绪"
for i in $(seq 1 60); do
    DB_OK=$(docker compose exec -T db pg_isready -U prism 2>/dev/null && echo "1" || echo "0")
    WEB_OK=$(curl --noproxy localhost -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)

    if [ "$DB_OK" = "1" ] && [ "$WEB_OK" != "000" ]; then
        echo ""
        info "所有服务已就绪"
        break
    fi
    echo -n "."
    sleep 2
    if [ "$i" -eq 60 ]; then
        echo ""
        error "服务启动超时，请检查 docker compose logs"
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "  Prism 已启动"
echo -e "  前端: ${YELLOW}http://localhost:3000${NC}"
echo -e "  后端: ${YELLOW}http://localhost:8001${NC}"
echo -e "  数据库: ${YELLOW}localhost:5432${NC}"
echo -e ""
echo -e "  查看日志: docker compose logs -f"
echo -e "  停止服务: docker compose down"
echo -e "${GREEN}========================================${NC}"
