#!/bin/bash
# Prism 前端页面生成 — 一键执行脚本
# 用法：bash /root/cy/prism/scripts/setup-claude-and-run.sh

set -e

# 1. 确保依赖已安装
cd /root/cy/prism/web
if [ ! -d node_modules ]; then
  npm install --legacy-peer-deps 2>/dev/null
  echo "✅ 前端依赖已安装"
else
  echo "✅ 前端依赖已存在"
fi

# 2. 读取提示词并启动 Claude Code（用 Sonnet，机械性任务）
cd /root/cy/prism
PROMPT=$(cat /root/cy/prism/docs/prompt-generate-all-pages.md)

echo "🚀 启动 Claude Code 执行页面生成..."
claude -p "$PROMPT" --model sonnet
