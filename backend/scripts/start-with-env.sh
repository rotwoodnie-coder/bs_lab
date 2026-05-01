#!/usr/bin/env bash
# PM2 后端启动包装脚本
# 从项目根目录加载 .env.local（被 .gitignore 排除，不会泄漏到仓库）
set -euo pipefail

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/*/bin"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 从根目录 .env.local 提取关键变量，避免全量 source 污染 NODE_ENV
if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
  eval "$(grep -E '^(MINIO_|MEDIA_APP_|DB_|PORT|NODE_ENV)' "$PROJECT_ROOT/.env.local" | tr -d '\r' | sed 's/^/export /')"
else
  echo "[start-with-env] WARN: .env.local not found at $PROJECT_ROOT/.env.local"
fi

cd "$SCRIPT_DIR/.."
exec pnpm exec tsx src/http/server.ts
