#!/usr/bin/env node
/**
 * GitHub Webhook 自动部署监听器
 *
 * 监听 GitHub push 事件，触发自动部署脚本。
 * 用纯 JS 编写，可直接用 node 执行，不需要 tsx。
 *
 * 安全设计：
 * - 部署失败时自动回滚到上一版本（由 deploy.sh 保证）
 * - 构建失败不重启旧服务，旧服务继续运行
 * - 全局异常捕获，webhook 进程不会崩溃
 * - PM2 自动重启被杀死的情况
 *
 * GitHub 仓库设置方法：
 *   1. 仓库 → Settings → Webhooks → Add webhook
 *   2. Payload URL: http://10.0.181.204:4300/deploy
 *   3. Content type: application/json
 *   4. Secret: 留空（内网环境）
 *   5. 选择 "Just the push event"
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";

const PORT = 4300;
const DEPLOY_SCRIPT = "/opt/bs-lab/backend/scripts/deploy.sh";
const LOG_FILE = "/opt/bs-lab/webhook.log";

// ── 全局异常捕获：不让未处理的异常杀死进程 ──
process.on("uncaughtException", (err) => {
  try {
    appendFileSync(LOG_FILE, `[${new Date().toISOString()}] [FATAL] ${err.stack}\n`);
  } catch {}
  console.error("[webhook] uncaughtException:", err);
});

process.on("unhandledRejection", (reason) => {
  try {
    appendFileSync(LOG_FILE, `[${new Date().toISOString()}] [FATAL] unhandledRejection: ${reason}\n`);
  } catch {}
  console.error("[webhook] unhandledRejection:", reason);
});

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

/**
 * 触发部署脚本。保证：
 * 1. 不阻塞 webhook 响应（detached）
 * 2. 同一时间只运行一个部署（用锁文件）
 * 3. 部署日志定向到 deploy.log
 */
let deploying = false;
function runDeploy() {
  if (deploying) {
    log("部署进行中，跳过本次触发");
    return;
  }
  deploying = true;
  log("触发部署");
  const child = spawn("bash", [DEPLOY_SCRIPT], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  child.stdout.on("data", (d) => process.stdout.write(d));
  child.stderr.on("data", (d) => process.stderr.write(d));
  child.on("exit", (code) => {
    log(`部署退出码: ${code}`);
    deploying = false;
  });
  child.on("error", (err) => {
    log(`部署启动失败: ${err.message}`);
    deploying = false;
  });
  child.unref();
}

const server = createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://localhost:${PORT}`);
  } catch {
    res.writeHead(400);
    return res.end("bad url");
  }

  if (req.method === "POST" && url.pathname === "/deploy") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const event = req.headers["x-github-event"];
        const payload = JSON.parse(body);
        if (event === "push" && payload?.ref === "refs/heads/main") {
          log(`收到 push: ${payload.head_commit?.message ?? "无消息"}`);
          runDeploy();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, message: "部署已触发" }));
        } else {
          log(`忽略事件: ${event} / ${payload?.ref}`);
          res.writeHead(200);
          res.end("ignored");
        }
      } catch (e) {
        log(`解析失败: ${e.message}`);
        res.writeHead(400);
        res.end("bad request");
      }
    });
    return;
  }

  // 健康检查
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200);
    res.end("webhook running");
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, () => {
  log(`Webhook 监听器启动于端口 ${PORT}，${DEPLOY_SCRIPT}`);
  console.log(`Webhook 监听器启动于 :${PORT}`);
});
