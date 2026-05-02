#!/usr/bin/env bash
set -e

echo ">>> 类型检查..."
pnpm run typecheck
echo ">>> 构建前端..."
pnpm run build
echo "✅ 本地检查通过"
