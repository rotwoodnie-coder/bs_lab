import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const port = Number(process.env.FRONTEND_DEV_PORT ?? process.env.PORT_FRONTEND ?? process.env.PORT ?? 4200);
const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = path.join(packageRoot, "node_modules", "next", "dist", "bin", "next");
/** 仓库根 `.env.local`：解析后合并进 Next 子进程 env，与后端读同一文件（后端 dev 仍使用 argv `--env-file`）。 */
const repoRootEnvLocal = path.join(packageRoot, "..", ".env.local");

/** 子进程不继承含 `--env-file` 的 NODE_OPTIONS（Node 会拒绝）。 */
function spawnEnvForNodeChild() {
  const env = { ...process.env };
  const raw = env.NODE_OPTIONS;
  if (raw && typeof raw === "string") {
    const kept = raw
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--env-file"));
    if (kept.length) env.NODE_OPTIONS = kept.join(" ");
    else delete env.NODE_OPTIONS;
  }
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
  console.log(`[frontend:dev] port ${port} is already in use, reuse existing frontend process.`);
  process.exit(0);
}

/**
 * Node 25 + Next 16：在子进程 argv 上使用 `--env-file` 会触发
 *「--env-file= is not allowed in NODE_OPTIONS」。改为解析根目录 `.env.local` 并写入 env。
 */
function mergeRepoRootEnvLocal(baseEnv) {
  if (!existsSync(repoRootEnvLocal)) return baseEnv;
  try {
    const parsed = parseEnv(readFileSync(repoRootEnvLocal, "utf8"));
    return { ...baseEnv, ...parsed };
  } catch {
    return baseEnv;
  }
}

function spawnNextDev() {
  const childEnv = mergeRepoRootEnvLocal(spawnEnvForNodeChild());

  // 透传 MINIO_ENDPOINT → NEXT_PUBLIC_MINIO_ENDPOINT、MINIO_PUBLIC_URL → NEXT_PUBLIC_MINIO_PUBLIC_URL
  if (childEnv.MINIO_ENDPOINT?.trim()) {
    childEnv.NEXT_PUBLIC_MINIO_ENDPOINT = childEnv.MINIO_ENDPOINT.trim();
  }
  if (childEnv.MINIO_PUBLIC_URL?.trim()) {
    childEnv.NEXT_PUBLIC_MINIO_PUBLIC_URL = childEnv.MINIO_PUBLIC_URL.trim();
  }
  const childEnv = mergeRepoRootEnvLocal(spawnEnvForNodeChild());

  if (existsSync(nextCli)) {
    return spawn(process.execPath, [nextCli, "dev", "-p", String(port)], {
      stdio: "inherit",
      cwd: packageRoot,
      env: childEnv,
    });
  }

  const isWin = process.platform === "win32";
  return spawn(isWin ? "pnpm.cmd" : "pnpm", ["exec", "next", "dev", "-p", String(port)], {
    stdio: "inherit",
    cwd: packageRoot,
    shell: isWin,
    env: childEnv,
  });
}

const child = spawnNextDev();

child.on("error", (err) => {
  console.error("[frontend:dev] failed to start Next.js:", err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (typeof code === "number") {
    process.exit(code);
    return;
  }
  if (signal) {
    console.error(`[frontend:dev] exited with signal ${signal}`);
  }
  process.exit(1);
});
