#!/usr/bin/env bash
# 自动部署脚本 — 被 webhook 触发时调用
# PM2 以 root 运行，不需要 sudo
# 安全策略：构建失败不重启；运行时健康检查失败则自动回滚
set -euo pipefail

DEPLOY_LOG="/opt/bs-lab/deploy.log"
DEPLOY_DIR="/opt/bs-lab"
GIT_STASH_REF="/opt/bs-lab/.git-stash-ref"
HEALTH_TIMEOUT=30   # 健康检查等待秒数

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始部署..." | tee -a "$DEPLOY_LOG"

cd "$DEPLOY_DIR"

# ── 记录当前提交哈希，用于回滚 ──
OLD_COMMIT=$(git rev-parse HEAD)
echo ">>> 当前版本: $OLD_COMMIT" | tee -a "$DEPLOY_LOG"

# ── 拉取最新代码 ──
echo ">>> git pull..." | tee -a "$DEPLOY_LOG"
git pull 2>&1 | tee -a "$DEPLOY_LOG"

NEW_COMMIT=$(git rev-parse HEAD)
if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
  echo ">>> 无新提交，跳过构建。" | tee -a "$DEPLOY_LOG"
  exit 0
fi

# ── 安装依赖 ──
echo ">>> pnpm install..." | tee -a "$DEPLOY_LOG"
pnpm install 2>&1 | tee -a "$DEPLOY_LOG"

# ── 构建前端（失败时不重启，旧服务继续运行） ──
echo ">>> pnpm build..." | tee -a "$DEPLOY_LOG"
cd frontend
# 用 sudo 清理 .next 缓存，防止 PM2 之前以 root 运行时残留的权限问题
sudo rm -rf .next 2>/dev/null || rm -rf .next 2>/dev/null || echo ">>> WARN: .next 清理不完全，尝试继续构建..."
set +e  # 临时关闭 exit-on-error，捕获构建结果
pnpm build 2>&1 | tee -a "$DEPLOY_LOG"
BUILD_EXIT=${PIPESTATUS[0]}
set -e

if [ "$BUILD_EXIT" -ne 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 构建失败（退出码 $BUILD_EXIT），停止部署。旧服务不受影响。" | tee -a "$DEPLOY_LOG"
  echo ">>> 回滚代码到 $OLD_COMMIT..." | tee -a "$DEPLOY_LOG"
  git reset --hard "$OLD_COMMIT" 2>&1 | tee -a "$DEPLOY_LOG"
  echo "----------------------------------------" | tee -a "$DEPLOY_LOG"
  exit 1
fi

# ── 重启服务（用 ecosystem 配置，确保未注册的 app 也会被启动） ──
echo ">>> pm2 startOrReload ecosystem.config.cjs..." | tee -a "$DEPLOY_LOG"
cd "$DEPLOY_DIR"
pm2 startOrReload ecosystem.config.cjs --update-env 2>&1 | tee -a "$DEPLOY_LOG"

# ── 健康检查：验证后端和前端是否正常响应 ──
echo ">>> 健康检查（最长等待 ${HEALTH_TIMEOUT}s）..." | tee -a "$DEPLOY_LOG"
BACKEND_OK=false
FRONTEND_OK=false
for i in $(seq 1 "$HEALTH_TIMEOUT"); do
  BACKEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4100/v2/dict/school-levels 2>/dev/null || echo "000")
  if [ "$BACKEND_CODE" != "000" ]; then BACKEND_OK=true; fi

  FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4200 2>/dev/null || echo "000")
  if [ "$FRONTEND_CODE" != "000" ]; then FRONTEND_OK=true; fi

  if $BACKEND_OK && $FRONTEND_OK; then break; fi
  sleep 1
done

if $BACKEND_OK && $FRONTEND_OK; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 部署成功（后端=$BACKEND_CODE，前端=$FRONTEND_CODE）" | tee -a "$DEPLOY_LOG"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 健康检查失败，自动回滚到 $OLD_COMMIT..." | tee -a "$DEPLOY_LOG"
  git reset --hard "$OLD_COMMIT" 2>&1 | tee -a "$DEPLOY_LOG"
  cd frontend
  rm -rf .next
  pnpm build 2>&1 | tee -a "$DEPLOY_LOG"
  cd "$DEPLOY_DIR"
  pm2 restart all 2>&1 | tee -a "$DEPLOY_LOG"
  echo ">>> 已回滚至 $OLD_COMMIT" | tee -a "$DEPLOY_LOG"
  # 回滚后重新从 ecosystem 启动，确保所有 app 注册正确
  pm2 startOrReload ecosystem.config.cjs --update-env 2>&1 | tee -a "$DEPLOY_LOG"
fi

echo "----------------------------------------" | tee -a "$DEPLOY_LOG"
