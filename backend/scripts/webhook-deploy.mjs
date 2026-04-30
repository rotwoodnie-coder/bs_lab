#!/usr/bin/env node
/**
 * GitHub Webhook 自动部署监听器
 *
 * 监听 GitHub push 事件，触发自动部署脚本。
 * 用纯 JS 编写，可直接用 node 执行，不需要 tsx。
 *
 * 启动方式：node backend/scripts/webhook-deploy.mjs
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
import { writeFileSync, appendFileSync } from "node:fs";

const PORT = 4300;
const DEPLOY_SCRIPT = "/opt/bs-lab/backend/scripts/deploy.sh";
const LOG_FILE = "/opt/bs-lab/webhook.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

function runDeploy() {
  log("触发部署");
  const child = spawn("bash", [DEPLOY_SCRIPT], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  child.stdout.on("data", (d) => log(`[deploy] ${d.toString().trim()}`));
  child.stderr.on("data", (d) => log(`[deploy:err] ${d.toString().trim()}`));
  child.on("exit", (code) => log(`部署退出码: ${code}`));
  child.unref();
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

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
  log(`Webhook 监听器启动于端口 ${PORT}`);
  console.log(`Webhook 监听器启动于 :${PORT}`);
});
