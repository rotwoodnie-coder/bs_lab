/**
 * PM2 生态系统配置
 *
 * 全部指向真实 JS 入口文件，避免 .bin/ 下的 shell 脚本被 Node 执行报错。
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
      },
      env_file: "../.env.local",
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "bs-lab-frontend",
      cwd: "./frontend",
      // next 的 JS 入口（不走 .bin/next shell 脚本）
      script: "node_modules/next/dist/bin/next.js",
      args: "start -p 4200",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
