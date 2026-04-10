#!/bin/bash
# Prism PostgreSQL 恢复脚本
# 用法: ./scripts/restore.sh <backup_file>

set -euo pipefail

if [ $# -eq 0 ]; then
  echo "用法: $0 <backup_file>"
  echo "可用备份:"
  ls -lh ./backups/prism_*.dump 2>/dev/null || echo "  (无备份文件)"
  exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="prism-db-1"
DB_USER="prism"
DB_NAME="prism"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "错误: 文件不存在: ${BACKUP_FILE}"
  exit 1
fi

echo "警告: 这将覆盖当前数据库 '${DB_NAME}' 的所有数据！"
read -p "确认恢复? (yes/no): " confirm
if [ "${confirm}" != "yes" ]; then
  echo "已取消"
  exit 0
fi

echo "[$(date)] Restoring from ${BACKUP_FILE}..."
cat "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" pg_restore -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists
echo "[$(date)] Restore complete!"
