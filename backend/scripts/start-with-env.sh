#!/usr/bin/env bash
# PM2 后端启动包装脚本
# 从项目根目录加载 .env.local（被 .gitignore 排除，不会泄漏到仓库）
set -euo pipefail

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/*/bin"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

set -a
source <(tr -d '\r' < "$PROJECT_ROOT/.env.local") 2>/dev/null \
  || echo "[start-with-env] WARN: .env.local not found at $PROJECT_ROOT/.env.local"
set +a

# 强制生产模式：.env.local 中可能写 NODE_ENV=development，会覆盖 PM2 设置
export NODE_ENV=production

cd "$SCRIPT_DIR/.."
exec pnpm exec tsx src/http/server.ts
