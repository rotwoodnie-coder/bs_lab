/**
 * PM2 生态系统配置
 *
 * 前后端统一用 interpreter: "none" + script: "pnpm"，走 shell 执行。
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
      script: "scripts/start-with-env.sh",
      interpreter: "none",
      env: {
        PORT: "4100",
        NODE_ENV: "production",
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
    {
      name: "bs-lab-webhook",
      cwd: "./backend",
      script: "node",
      args: "scripts/webhook-deploy.mjs",
      interpreter: "none",
      watch: false,
      max_memory_restart: "200M",
    },
  ],
};
