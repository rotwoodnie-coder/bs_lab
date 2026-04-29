import { spawn } from "node:child_process";
import net from "node:net";

const port = Number(process.env.BACKEND_DEV_PORT ?? process.env.PORT_BACKEND ?? 4100);

/** Node 20+ 不允许在 NODE_OPTIONS 中出现 --env-file；清理后再 spawn 子进程。 */
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
