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

# 2. 启动 Docker 服务 (PostgreSQL + API)
info "启动 Docker 服务..."
DOCKER_BUILDKIT=0 docker compose up -d --build --pull=false

# 等待 PostgreSQL 就绪
echo -n "等待 PostgreSQL 就绪"
for i in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U prism >/dev/null 2>&1; then
        echo ""
        info "PostgreSQL 已就绪"
        break
    fi
    echo -n "."
    sleep 1
    if [ "$i" -eq 30 ]; then
        echo ""
        error "PostgreSQL 启动超时"
    fi
done

# 3. 安装前端依赖
cd "$PROJECT_DIR/web"
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
    info "安装前端依赖..."
    npm install
else
    info "前端依赖已是最新"
fi

# 4. 清理残留的 Next.js 进程
OLD_PID=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$OLD_PID" ]; then
    warn "端口 3000 被占用 (PID: $OLD_PID)，正在清理..."
    kill "$OLD_PID" 2>/dev/null || true
    sleep 1
fi

# 5. 启动前端
info "启动 Next.js 开发服务器..."
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "  Prism 已启动"
echo -e "  前端: ${YELLOW}http://localhost:3000${NC}"
echo -e "  后端: ${YELLOW}http://localhost:8001${NC}"
echo -e "  数据库: ${YELLOW}localhost:5432${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

exec npm run dev
