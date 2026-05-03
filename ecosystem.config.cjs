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
      cwd: "/opt/bs-lab/backend",
      script: "bash",
      args: "-c \"set -a && source /opt/bs-lab/.env.local && set +a && cd /opt/bs-lab/backend && bash scripts/start-with-env.sh\"",
      env: {
        PORT: "4100",
        NODE_ENV: "production",
      },
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "bs-lab-frontend",
      cwd: "/opt/bs-lab/frontend",
      script: "/www/server/nodejs/v22.22.2/bin/node",
      args: "node_modules/.bin/next start -p 4200",
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
      env: {
        PATH: "/www/server/nodejs/v22.22.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      },
      // watch: false — deploy.sh 负责 git pull，webhook 自身无需 reload
      // PM2 的 crash auto-restart 已保证 webhook 崩了自动拉起
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
