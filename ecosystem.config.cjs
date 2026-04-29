/**
 * PM2 生态系统配置
 *
 * ## 首次启动
 *   cd /opt/bs-lab && sudo git pull && cd frontend && sudo rm -rf .next && sudo pnpm build && cd ..
 *   sudo pm2 delete all && sudo pm2 start ecosystem.config.cjs
 *
 * ## 更新代码后重启
 *   cd /opt/bs-lab && sudo git pull && cd frontend && sudo rm -rf .next && sudo pnpm build && cd ..
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
      script: "npx",
      args: "tsx src/http/server.ts",
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
