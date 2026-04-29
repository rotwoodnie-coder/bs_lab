/**
 * PM2 生态系统配置
 *
 * 全部通过 pnpm workspace 驱动，确保路径解析和依赖管理与开发环境一致。
 * 使用 exec_interpreter: "none" 让 PM2 走 shell 执行（pnpm/tsx/next 均为 shell/Node 脚本）。
 *
 * ## 首次启动
 *   cd /opt/bs-lab && sudo pm2 delete all && sudo pm2 start ecosystem.config.cjs
 *
 * ## 更新代码后重启
 *   cd /opt/bs-lab && git pull && cd frontend && rm -rf .next && pnpm build && cd ..
 *   sudo pm2 restart all
 *
 * ## 查看状态
 *   sudo pm2 status
 *   sudo pm2 logs bs-lab-backend --lines 30
 */
module.exports = {
  apps: [
    {
      name: "bs-lab-backend",
      // 在 ./backend 目录下用 pnpm exec tsx 启动 TypeScript 服务器
      cwd: "./backend",
      script: "pnpm",
      args: "exec tsx src/http/server.ts",
      exec_interpreter: "none",
      env: {
        PORT: "4100",
        NODE_ENV: "production",
      },
      env_file: "../.env.local",
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "bs-lab-frontend",
      // 在 ./frontend 目录下用 next start 启动生产模式
      cwd: "./frontend",
      script: "node_modules/.bin/next",
      args: "start -p 4200",
      exec_interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
