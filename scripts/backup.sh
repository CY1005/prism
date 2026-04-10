#!/bin/bash
# Prism PostgreSQL 备份脚本
# 用法: ./scripts/backup.sh
# Cron: 0 3 * * * cd /root/cy/prism && ./scripts/backup.sh

set -euo pipefail

BACKUP_DIR="./backups"
CONTAINER_NAME="prism-db-1"
DB_USER="prism"
DB_NAME="prism"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/prism_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup..."
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -Fc "${DB_NAME}" > "${BACKUP_FILE}"
echo "[$(date)] Backup saved: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# 清理超过 RETENTION_DAYS 天的备份
find "${BACKUP_DIR}" -name "prism_*.dump" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Cleaned backups older than ${RETENTION_DAYS} days"
