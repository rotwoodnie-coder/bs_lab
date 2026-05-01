/**
 * PM2 生态系统配置
 *
 * 项目目录已 chown 给 ubuntu 用户，PM2 以 ubuntu 用户运行，无需 sudo。
 *
 * ## 首次启动
 *   cd /opt/bs-lab && pm2 delete all && pm2 start ecosystem.config.cjs
 *
 * ## 更新代码后重启
 *   cd /opt/bs-lab && git pull && cd frontend && rm -rf .next && pnpm build && cd ..
 *   pm2 restart all
 *
 * ## 查看状态
 *   pm2 status
 *   pm2 logs bs-lab-backend --lines 30
 */
module.exports = {
  apps: [
    {
      name: "bs-lab-backend",
      cwd: "./backend",
      script: "scripts/start-with-env.sh",
      interpreter: "bash",
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
      max_memory_restart: "500M",
    },
  ],
};
