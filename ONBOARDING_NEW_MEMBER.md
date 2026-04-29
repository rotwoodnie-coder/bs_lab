# BS Lab 新同事首次接手说明

本文面向第一次接手本项目的同事，按顺序执行即可完成本地启动。

## 1. 前置准备

- 安装 Git（可用 `git --version` 验证）
- 安装 Node.js 20 LTS 或更高（可用 `node -v` 验证）
- 使用 GitHub 账号并配置 SSH Key（确保有仓库访问权限）

## 2. 通过 SSH 克隆项目

```bash
cd D:/dev_program
git clone git@github.com:rotwoodnie-coder/bs_lab.git
cd bs_lab
```

## 3. 安装并启用 pnpm

本仓库固定使用 `pnpm`，请勿混用 `npm install` 或 `yarn install`。

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

如果 `pnpm` 命令找不到，请关闭终端重新打开后再试。

## 4. 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

## 5. 配置环境变量

1. 参考根目录 `.env.example` 创建本地环境文件（通常为 `.env.local`）。
2. 按团队提供的配置填写数据库、服务地址、密钥等变量。
3. 严禁提交真实密钥到仓库。

## 6. 启动项目

```bash
# 同时启动前端和后端
pnpm dev

# 仅启动前端
pnpm dev:frontend

# 仅启动后端
pnpm dev:backend
```

常用默认地址（以本地实际输出为准）：

- 前端：`http://localhost:4100` 或 `http://localhost:3000`
- 后端：`http://localhost:4200`

## 7. 常用命令

```bash
# 前后端类型检查
pnpm typecheck

# 构建前端
pnpm build

# 释放端口占用并重启开发环境
pnpm dev:fresh
```

## 8. Git 协作建议

- 从主干分支拉取最新代码后再开功能分支
- 功能分支命名建议：`feat/xxx`、`fix/xxx`
- 通过 Pull Request 合并，不直接推送主干

## 9. 常见问题排查

### Q1：`pnpm` 无法识别

执行：

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

若仍失败，重启终端并再次执行 `pnpm -v`。

### Q2：SSH 克隆失败（Permission denied）

- 检查本机是否已生成 SSH key
- 检查公钥是否已添加到 GitHub 账号
- 检查当前账号是否已加入仓库协作权限

### Q3：端口被占用

优先执行：

```bash
pnpm dev:fresh
```

## 10. 相关文档

- 根目录：`README.md`
- 根目录：`CONTRIBUTING.md`
- 前端说明：`frontend/README.md`
- 后端说明：`backend/README.md`
