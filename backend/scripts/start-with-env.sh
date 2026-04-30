#!/usr/bin/env bash
# PM2 后端启动包装脚本
# 从项目根目录加载 .env.local（被 .gitignore 排除，不会泄漏到仓库）
# 加载用户 shell 环境（PM2 以非交互方式启动，PATH 不完整）
set -euo pipefail

if [ -f "$HOME/.bashrc" ]; then
  . "$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then
  . "$HOME/.profile"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

set -a
source "$PROJECT_ROOT/.env.local" 2>/dev/null || echo "[start-with-env] WARN: .env.local not found"
set +a

cd "$SCRIPT_DIR/.."
# 显式通过 PATH 查找 pnpm，避免 PM2 环境 PATH 不完整
PNPM=$(command -v pnpm 2>/dev/null || echo "")
if [ -z "$PNPM" ]; then
  # pnpm 可能装在 ~/.local/share/pnpm 或 ~/.nvm/versions/... 下
  for p in "$HOME/.local/share/pnpm/pnpm" "$HOME/.nvm/versions/node/$(node --version 2>/dev/null)/bin/pnpm" "/usr/local/bin/pnpm" "/usr/bin/pnpm"; do
    if [ -x "$p" ]; then
      PNPM="$p"
      break
    fi
  done
fi
if [ -z "$PNPM" ]; then
  echo "[start-with-env] FATAL: pnpm not found in PATH or any known location" >&2
  exit 1
fi
exec "$PNPM" exec tsx src/http/server.ts
