/**
 * PM2 生态系统配置
 *
 * ## 首次启动（先手动 build 前端）
 *   cd /opt/bs-lab
 *   pm2 start ecosystem.config.cjs
 *
 * ## 更新代码后重启
 *   cd /opt/bs-lab && git pull && cd frontend && pnpm build && cd ..
 *   pm2 restart all
 *
 * ## 查看状态
 *   pm2 status
 *   pm2 logs
 *   pm2 logs bs-lab-backend --lines 50
 */
module.exports = {
  apps: [
    {
      name: "bs-lab-backend",
      cwd: "./backend",
      script: "src/http/server.ts",
      interpreter: "node",
      interpreterArgs: "--experimental-strip-types",
      env: {
        PORT: "4100",
        NODE_ENV: "production",
      },
      // .env.local 在仓库根目录，通过 env_file 相对 cwd 的路径引用
      env_file: "../.env.local",
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "bs-lab-frontend",
      cwd: "./frontend",
      script: "node_modules/.bin/next",
      args: "start -p 4200",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
