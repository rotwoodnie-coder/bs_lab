#!/usr/bin/env bash
# 自动部署脚本 — 被 webhook 触发时调用
# PM2 以 root 运行，所有 pm2 命令必须加 sudo
# 安全策略：构建失败不重启；尝试自动修复已知错误后重试；无法修复则回滚
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
cd "$DEPLOY_DIR/frontend"
# 清理 .next 和 next-env.d.ts（PM2 root 运行时残留的权限问题）
sudo rm -rf .next 2>/dev/null || true
sudo rm -f next-env.d.ts 2>/dev/null || true
set +e  # 临时关闭 exit-on-error，捕获构建结果
pnpm build 2>&1 | tee -a "$DEPLOY_LOG"
BUILD_EXIT=${PIPESTATUS[0]}
set -e
cd "$DEPLOY_DIR"

if [ "$BUILD_EXIT" -ne 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 构建失败（退出码 $BUILD_EXIT）" | tee -a "$DEPLOY_LOG"

  # ── 嗅探错误模式并尝试自动修复 ──
  BUILD_LOG=$(tail -50 "$DEPLOY_LOG")
  AUTO_FIXED=false

  if echo "$BUILD_LOG" | grep -qi "EACCES"; then
    echo ">>> 🔧 检测到 EACCES 权限问题，尝试 chown 修复..." | tee -a "$DEPLOY_LOG"
    sudo chown -R ubuntu:ubuntu "$DEPLOY_DIR/frontend/.next" "$DEPLOY_DIR/frontend/next-env.d.ts" 2>/dev/null || true
    sudo rm -rf "$DEPLOY_DIR/frontend/.next" 2>/dev/null || true
    sudo rm -f "$DEPLOY_DIR/frontend/next-env.d.ts" 2>/dev/null || true
    echo ">>> 重新构建..." | tee -a "$DEPLOY_LOG"
    cd "$DEPLOY_DIR/frontend"
    set +e
    pnpm build 2>&1 | tee -a "$DEPLOY_LOG"
    BUILD_EXIT=${PIPESTATUS[0]}
    set -e
    cd "$DEPLOY_DIR"
    if [ "$BUILD_EXIT" -eq 0 ]; then
      AUTO_FIXED=true
      echo ">>> ✅ 自动修复 EACCES 后构建成功" | tee -a "$DEPLOY_LOG"
    fi
  fi

  if ! $AUTO_FIXED; then
    echo ">>> 停止部署。旧服务不受影响。" | tee -a "$DEPLOY_LOG"
    # ── 打印可操作的修复指引 ──
    if echo "$BUILD_LOG" | grep -qi "Cannot find module"; then
      echo ">>> 💡 提示：模块未找到，尝试 sudo pnpm install 后重试" | tee -a "$DEPLOY_LOG"
    elif echo "$BUILD_LOG" | grep -qi "ts2304\|ts2307\|Type.*is not assignable"; then
      echo ">>> 💡 提示：TypeScript 类型错误，请本地 pnpm run typecheck 排查" | tee -a "$DEPLOY_LOG"
    elif echo "$BUILD_LOG" | grep -qi "SyntaxError\|Unexpected token"; then
      echo ">>> 💡 提示：语法错误，请检查最近提交的代码" | tee -a "$DEPLOY_LOG"
    elif echo "$BUILD_LOG" | grep -qi "EACCES\|permission denied"; then
      echo ">>> 💡 提示：权限问题，尝试 sudo chown -R ubuntu:ubuntu frontend/ 后重试" | tee -a "$DEPLOY_LOG"
    elif echo "$BUILD_LOG" | grep -qi "ENOSPC\|no space left"; then
      echo ">>> 💡 提示：磁盘空间不足，请清理服务器磁盘" | tee -a "$DEPLOY_LOG"
    fi
    echo ">>> 回滚代码到 $OLD_COMMIT..." | tee -a "$DEPLOY_LOG"
    git reset --hard "$OLD_COMMIT" 2>&1 | tee -a "$DEPLOY_LOG"
    echo "----------------------------------------" | tee -a "$DEPLOY_LOG"
    exit 1
  fi
fi

# ── 重启服务（用 ecosystem 配置，确保未注册的 app 也会被启动） ──
echo ">>> sudo pm2 startOrReload ecosystem.config.cjs..." | tee -a "$DEPLOY_LOG"
cd "$DEPLOY_DIR"
# 将 VERSION 同步到 package.json，让 PM2 状态表显示真实版本号
SYNC_VERSION=$(cat VERSION 2>/dev/null || echo "0.0.0")
for pkg in backend/package.json frontend/package.json; do
  if [ -f "$pkg" ]; then
    sed -i "s/\"version\": \".*\"/\"version\": \"$SYNC_VERSION\"/" "$pkg"
    echo ">>> 同步版本 $SYNC_VERSION → $pkg" | tee -a "$DEPLOY_LOG"
  fi
done
sudo pm2 startOrReload ecosystem.config.cjs --update-env 2>&1 | tee -a "$DEPLOY_LOG"

# ── 刷新 Nginx（确保新静态资源被正确路由） ──
echo ">>> nginx -s reload..." | tee -a "$DEPLOY_LOG"
sudo nginx -s reload 2>&1 | tee -a "$DEPLOY_LOG"

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
  echo ">>> 回滚后尝试重新构建..." | tee -a "$DEPLOY_LOG"
  cd "$DEPLOY_DIR/frontend"
  sudo rm -rf .next 2>/dev/null || true
  sudo rm -f next-env.d.ts 2>/dev/null || true
  set +e
  pnpm build 2>&1 | tee -a "$DEPLOY_LOG"
  RETRY_EXIT=${PIPESTATUS[0]}
  set -e
  cd "$DEPLOY_DIR"
  if [ "$RETRY_EXIT" -ne 0 ]; then
    # 回滚构建也失败时尝试 EACCES 自动修复
    if tail -30 "$DEPLOY_LOG" | grep -qi "EACCES"; then
      echo ">>> 🔧 回滚构建也遇 EACCES，尝试清理权限重试..." | tee -a "$DEPLOY_LOG"
      sudo rm -rf "$DEPLOY_DIR/frontend/.next" "$DEPLOY_DIR/frontend/next-env.d.ts" 2>/dev/null || true
      cd "$DEPLOY_DIR/frontend"
      set +e
      pnpm build 2>&1 | tee -a "$DEPLOY_LOG"
      RETRY_EXIT=${PIPESTATUS[0]}
      set -e
      cd "$DEPLOY_DIR"
    fi
  fi
  if [ "$RETRY_EXIT" -eq 0 ]; then
    echo ">>> 回滚后构建成功" | tee -a "$DEPLOY_LOG"
  else
    echo ">>> ⚠ 回滚后构建仍失败，将尝试启动旧版服务" | tee -a "$DEPLOY_LOG"
  fi
  sudo pm2 restart all 2>&1 | tee -a "$DEPLOY_LOG"
  echo ">>> 已回滚至 $OLD_COMMIT" | tee -a "$DEPLOY_LOG"
  # 回滚后重新从 ecosystem 启动，确保所有 app 注册正确
  SYNC_VERSION=$(cat VERSION 2>/dev/null || echo "0.0.0")
  for pkg in backend/package.json frontend/package.json; do
    if [ -f "$pkg" ]; then
      sed -i "s/\"version\": \".*\"/\"version\": \"$SYNC_VERSION\"/" "$pkg"
    fi
  done
  sudo pm2 startOrReload ecosystem.config.cjs --update-env 2>&1 | tee -a "$DEPLOY_LOG"
  sudo nginx -s reload 2>&1 | tee -a "$DEPLOY_LOG"
fi

echo "----------------------------------------" | tee -a "$DEPLOY_LOG"
