#!/bin/sh
set -e

echo "[entrypoint] Running Drizzle migrations..."
npx drizzle-kit push --force 2>&1 || echo "[entrypoint] Warning: drizzle-kit push failed, tables may already exist"

echo "[entrypoint] Starting Next.js..."
exec node server.js
