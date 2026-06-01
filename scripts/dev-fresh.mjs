/**
 * dev-fresh.mjs — 开发服务器"纯净版"启动器
 *
 * 1. 强制清理所有开发端口
 * 2. 执行自愈审计
 * 3. 启动 pnpm dev（自动含端口清理 + agents-service）
 *
 * 端口清理逻辑委托给 kill-ports.mjs，避免重复维护。
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import { killAndWaitPorts } from "./kill-ports.mjs";

const repoRoot = new URL("..", import.meta.url);
const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const backendPort = Number(process.env.BACKEND_DEV_PORT ?? process.env.PORT_BACKEND ?? 4100);
const frontendPort = Number(process.env.FRONTEND_DEV_PORT ?? process.env.PORT_FRONTEND ?? 4200);
const extraPort = 4300;
const agentPort = 5001;

// ── 清理端口（复用 kill-ports.mjs）──
const portsToFree = [backendPort, frontendPort, extraPort, agentPort];
await killAndWaitPorts(portsToFree);

// ── 加载 .env.local ──
function loadEnvLocal() {
  const envPath = new URL(".env.local", repoRoot);
  try {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key] || process.env[key].trim() === "") {
        process.env[key] = value;
      }
    }
    console.log(`[dev:fresh] loaded env from ${envPath.pathname}`);
  } catch {
    /* ignore missing .env.local */
  }
}

loadEnvLocal();

// ── 自愈审计 ──
if (!process.env.SKIP_AUDIT_HEAL) {
  const auditResult = spawnSync(pnpmCmd, ["audit:heal"], {
    stdio: "inherit",
    cwd: repoRoot,
  });
  if ((auditResult.status ?? 1) !== 0) {
    console.error("[dev:fresh] audit:heal failed, continuing to start dev servers...");
  }
}

// ── 启动主服务器 ──
const result = spawnSync(pnpmCmd, ["dev"], {
  stdio: "inherit",
  cwd: repoRoot,
});

process.exit(result.status ?? 1);
