#!/usr/bin/env bash
# PM2 后端启动包装脚本
# 从项目根目录加载 .env.local（被 .gitignore 排除，不会泄漏到仓库）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

set -a
source "$PROJECT_ROOT/.env.local" 2>/dev/null || echo "[start-with-env] WARN: .env.local not found"
set +a

cd "$SCRIPT_DIR/.."
exec pnpm exec tsx src/http/server.ts
