#!/bin/bash
#
# Prism 测试环境管理脚本
# 用法:
#   ./scripts/test-env.sh start   — 启动全部服务（DB + API + Web）
#   ./scripts/test-env.sh stop    — 关闭全部服务
#   ./scripts/test-env.sh restart — 重启全部
#   ./scripts/test-env.sh status  — 查看各服务状态
#

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

WEB_PORT=3001
WEB_LOG="/tmp/prism-nextjs.log"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; }

# ─── 状态检查 ──────────────────────────────────────────

check_db() {
  docker compose exec -T db pg_isready -U prism >/dev/null 2>&1
}

check_api() {
  NO_PROXY=localhost curl -sfL http://localhost:8001/health/ >/dev/null 2>&1
}

check_web() {
  NO_PROXY=localhost curl -sfL http://localhost:${WEB_PORT}/ -o /dev/null 2>&1
}

print_status() {
  echo ""
  echo "  服务状态:"
  if check_db;  then info "  DB        — localhost:5432";  else fail "  DB        — 未运行"; fi
  if check_api; then info "  API       — localhost:8001";  else fail "  API       — 未运行"; fi
  if check_web; then info "  Web       — localhost:${WEB_PORT}";  else fail "  Web       — 未运行"; fi
  echo ""
}

# ─── 启动 ──────────────────────────────────────────────

do_start() {
  echo ""
  echo -e "${GREEN}启动 Prism 测试环境${NC}"
  echo ""

  # 1. 检查 .env
  if [ ! -f .env ]; then
    warn ".env 不存在，从 .env.example 生成..."
    cp .env.example .env
    sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -base64 33)|" .env
    sed -i "s|^AI_KEY_ENCRYPTION_SECRET=.*|AI_KEY_ENCRYPTION_SECRET=$(openssl rand -hex 32)|" .env
    sed -i "s|^INTERNAL_TOKEN=.*|INTERNAL_TOKEN=$(openssl rand -hex 16)|" .env
    info ".env 已生成"
  fi

  # 2. 确保 web/.env.local 软链接存在
  if [ ! -e web/.env.local ]; then
    ln -s "$PROJECT_DIR/.env" web/.env.local
    info "web/.env.local → .env 软链接已创建"
  fi

  # 3. Docker 服务（DB + API）
  if check_db && check_api; then
    info "Docker 服务已在运行"
  else
    info "启动 Docker 服务 (DB + API)..."
    DOCKER_BUILDKIT=0 docker compose up -d --build --pull=false

    echo -n "  等待 DB 就绪"
    for i in $(seq 1 30); do
      if check_db; then echo ""; info "DB 就绪"; break; fi
      echo -n "."
      sleep 1
      [ "$i" -eq 30 ] && { echo ""; fail "DB 启动超时"; exit 1; }
    done

    echo -n "  等待 API 就绪"
    for i in $(seq 1 30); do
      if check_api; then echo ""; info "API 就绪"; break; fi
      echo -n "."
      sleep 1
      [ "$i" -eq 30 ] && { echo ""; fail "API 启动超时"; exit 1; }
    done
  fi

  # 4. 前端依赖
  cd "$PROJECT_DIR/web"
  if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
    info "安装前端依赖..."
    npm install --silent
  fi

  # 5. Next.js
  if check_web; then
    info "Next.js 已在运行"
  else
    fuser -k ${WEB_PORT}/tcp 2>/dev/null || true
    info "启动 Next.js (端口 ${WEB_PORT})..."
    NEXT_PUBLIC_ANALYZER_URL=http://localhost:8001 \
    NO_PROXY='*' no_proxy='*' \
      node_modules/.bin/next dev -p ${WEB_PORT} > "$WEB_LOG" 2>&1 &
    disown

    echo -n "  等待 Web 就绪"
    for i in $(seq 1 15); do
      if check_web; then echo ""; info "Web 就绪"; break; fi
      echo -n "."
      sleep 1
      [ "$i" -eq 15 ] && { echo ""; warn "Web 启动较慢，日志: $WEB_LOG"; }
    done
  fi

  cd "$PROJECT_DIR"

  # 6. 汇总
  echo ""
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo -e "  Prism 测试环境已启动"
  echo -e "  Web:  ${YELLOW}http://localhost:${WEB_PORT}${NC}"
  echo -e "  API:  ${YELLOW}http://localhost:8001${NC}"
  echo -e "  DB:   ${YELLOW}localhost:5432${NC}"
  echo -e "  日志: ${DIM}${WEB_LOG}${NC}"
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo ""
}

# ─── 关闭 ──────────────────────────────────────────────

do_stop() {
  echo ""
  echo -e "${RED}关闭 Prism 测试环境${NC}"
  echo ""

  # 1. Next.js
  if fuser ${WEB_PORT}/tcp 2>/dev/null | grep -q .; then
    fuser -k ${WEB_PORT}/tcp 2>/dev/null || true
    info "Next.js 已关闭"
  else
    info "Next.js 未在运行"
  fi

  # 2. Docker
  cd "$PROJECT_DIR"
  docker compose down
  info "Docker 服务已关闭 (DB + API)"

  echo ""
  info "测试环境已完全关闭"
  echo ""
}

# ─── 入口 ──────────────────────────────────────────────

case "${1:-}" in
  start)
    do_start
    ;;
  stop)
    do_stop
    ;;
  restart)
    do_stop
    do_start
    ;;
  status)
    print_status
    ;;
  *)
    echo "用法: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
