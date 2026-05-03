import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import { fileURLToPath } from "node:url";

const port = Number(process.env.BACKEND_DEV_PORT ?? process.env.PORT_BACKEND ?? 4100);

/** 手动加载 .env.local，确保子进程继承所有环境变量（不受 NODE_OPTIONS --env-file 被清除的影响） */
function loadEnvLocal(existing) {
  const envPath = new URL("../../.env.local", import.meta.url);
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
      // 不覆盖已显式设置的值
      if (!existing[key] || existing[key].trim() === "") {
        existing[key] = value;
      }
    }
  } catch {
    /* .env.local 不存在时静默忽略 */
  }
  return existing;
}

function spawnEnvForNodeChild() {
  const env = loadEnvLocal({ ...process.env });
  const raw = env.NODE_OPTIONS;
  if (raw && typeof raw === "string") {
    const kept = raw
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--env-file"));
    if (kept.length) env.NODE_OPTIONS = kept.join(" ");
    else delete env.NODE_OPTIONS;
  }
  // 开发环境强制为 development，避免 .env.local 中误写 NODE_ENV=production
  env.NODE_ENV = "development";
  return env;
}

function isPortInUse(targetPort) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port: targetPort, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      resolve(false);
    });
  });
}

const occupied = await isPortInUse(port);
if (occupied) {
  console.log(
    `[backend:dev] port ${port} is already in use — skipping start. If code changed, stop the old process and restart, or new routes (e.g. DELETE) will not load.`,
  );
  process.exit(0);
}

const child = spawn(
  process.execPath,
  ["--experimental-strip-types", "src/http/server.ts"],
  {
    stdio: "inherit",
    cwd: process.cwd(),
    env: spawnEnvForNodeChild(),
  },
);

child.on("exit", (code, signal) => {
  if (typeof code === "number") {
    process.exit(code);
    return;
  }
  if (signal) {
    console.error(`[backend:dev] exited with signal ${signal}`);
  }
  process.exit(1);
});
