/**
 * PM2 生态系统配置
 *
 * 前后端统一用 interpreter: "none" + script: "pnpm"，走 shell 执行，
 * 避免 .bin/ 下的 shell 脚本被 Node 当作 JS 执行报 SyntaxError。
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
      cwd: "./backend",
      script: "pnpm",
      args: "exec tsx src/http/server.ts",
      interpreter: "none",
      env: {
        PORT: "4100",
        NODE_ENV: "production",
        NODE_OPTIONS: "--env-file=../.env.local",
      },
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "bs-lab-frontend",
      cwd: "./frontend",
      script: "pnpm",
      args: "run start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
