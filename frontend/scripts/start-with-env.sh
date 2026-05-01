#!/usr/bin/env bash
# PM2 前端启动包装脚本
# 从项目根目录加载 .env.local（被 .gitignore 排除，不会泄漏到仓库）
set -euo pipefail

export PATH="/www/server/nodejs/v22.22.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/*/bin"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

set -a
source "$PROJECT_ROOT/.env.local" 2>/dev/null || echo "[start-with-env] WARN: .env.local not found"
set +a

# 清除 PORT 变量，防止 .env.local 中的 PORT=4100 被 Next.js 当作监听端口
unset PORT

cd "$SCRIPT_DIR/.."
exec npx next start -p 4200
