#!/usr/bin/env bash
# 自动部署脚本 — 被 webhook 触发时调用
# PM2 以 root 运行，不需要 sudo
set -euo pipefail

DEPLOY_LOG="/opt/bs-lab/deploy.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始部署..." | tee -a "$DEPLOY_LOG"

cd /opt/bs-lab

echo ">>> git pull..." | tee -a "$DEPLOY_LOG"
git pull 2>&1 | tee -a "$DEPLOY_LOG"

echo ">>> pnpm build..." | tee -a "$DEPLOY_LOG"
cd frontend
rm -rf .next
pnpm build 2>&1 | tee -a "$DEPLOY_LOG"

echo ">>> pm2 restart all..." | tee -a "$DEPLOY_LOG"
cd /opt/bs-lab
pm2 restart all 2>&1 | tee -a "$DEPLOY_LOG"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署完成" | tee -a "$DEPLOY_LOG"
echo "----------------------------------------" | tee -a "$DEPLOY_LOG"
