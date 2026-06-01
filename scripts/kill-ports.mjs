/**
 * kill-ports.mjs — 跨平台端口清理工具模块
 *
 * 提供 killPort / waitPortFree / killAndWaitPorts 三个导出函数，
 * 用于在启动开发服务器前强制释放目标端口。
 *
 * 使用方式:
 *   import { killAndWaitPorts } from "./kill-ports.mjs";
 *   await killAndWaitPorts([4100, 4200, 5001]);
 */
import { execSync } from "node:child_process";
import net from "node:net";

// ─── 端口检测 ──────────────────────────────────────────────

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

// ─── Windows 杀端口 ────────────────────────────────────────
//
// 思路：在 Node.js 中直接执行 netstat 并解析输出，提取 PID 后 taskkill。
// 比通过 PowerShell 管道处理更可控、更容易排查。
//
function killPortWindows(port) {
  let pids = [];

  // ── 方式 1: netstat -ano 直接解析（最可靠，兼容 Win10/11）──
  // 输出格式示例:
  //   TCP    0.0.0.0:4100           0.0.0.0:0              LISTENING       12345
  //   TCP    [::]:4100              [::]:0                 LISTENING       12345
  try {
    const out = execSync("netstat -ano -p tcp", {
      encoding: "utf8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    for (const line of out.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+/);
      // parts[0]=protocol, parts[1]=localAddr, parts[last]=PID
      if (parts.length >= 5) {
        const localAddr = parts[1];
        const pid = parts[parts.length - 1];
        if (localAddr.endsWith(`:${port}`) && /^\d+$/.test(pid)) {
          pids.push(pid);
        }
      }
    }
  } catch (err) {
    console.error(`[kill-ports] netstat failed:`, err.message);
  }

  // ── 方式 2: PowerShell Get-NetTCPConnection（备用）──
  if (pids.length === 0) {
    try {
      const psOut = execSync(
        `powershell -NoProfile -NonInteractive -Command "& { (Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess }"`,
        { encoding: "utf8", timeout: 10000, stdio: ["pipe", "pipe", "pipe"] },
      );
      pids = psOut
        .trim()
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => /^\d+$/.test(s));
    } catch {
      /* Get-NetTCPConnection 不存在（旧系统）则跳过 */
    }
  }

  // ── 杀进程（去重）──
  const uniquePids = [...new Set(pids)];
  if (uniquePids.length === 0) {
    console.log(`[kill-ports] port ${port}: no owning process found`);
    return;
  }
  for (const pid of uniquePids) {
    console.log(`[kill-ports] port ${port}: killing PID ${pid}...`);
    try {
      execSync(`taskkill /F /PID ${pid} /T`, {
        stdio: "pipe",
        timeout: 5000,
      });
      console.log(`[kill-ports] port ${port}: PID ${pid} killed`);
    } catch {
      console.log(`[kill-ports] port ${port}: PID ${pid} already dead or access denied`);
    }
  }
}

// ─── Unix 杀端口 ──────────────────────────────────────────

function killPortUnix(port) {
  try {
    execSync(`fuser -k -9 ${port}/tcp`, { stdio: "pipe" });
    return;
  } catch {
    try {
      const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      if (!out) return;
      const pids = out.split(/\s+/).filter(Boolean);
      for (const pid of pids) {
        execSync(`kill -9 ${pid}`, { stdio: "pipe" });
      }
    } catch {
      /* no listener or tools missing */
    }
  }
}

// ─── 跨平台杀端口 ─────────────────────────────────────────

export function killPort(port, label) {
  console.log(`[kill-ports] force-killing listeners on ${label || `port ${port}`}...`);
  if (process.platform === "win32") {
    killPortWindows(port);
  } else {
    killPortUnix(port);
  }
}

// ─── 等待端口释放 ─────────────────────────────────────────

export async function waitPortFree(port, label, maxWaitMs = 5000) {
  const interval = 300;
  let waited = 0;
  while (waited < maxWaitMs) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      console.log(`[kill-ports] ${label || `port ${port}`} is free`);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
    waited += interval;
  }
  console.error(
    `[kill-ports] WARNING: ${label || `port ${port}`} still occupied after ${maxWaitMs}ms, proceeding anyway...`,
  );
  return false;
}

// ─── 批量清理 ─────────────────────────────────────────────

export async function killAndWaitPorts(portList) {
  console.log(`[kill-ports] freeing ports: ${portList.join(", ")}`);

  // 第一轮：杀端口
  for (const port of portList) {
    killPort(port, `port ${port}`);
  }

  // 等待一轮
  for (const port of portList) {
    await waitPortFree(port, `port ${port}`);
  }

  // 第二轮：再杀 + 再等（避免残留）
  for (const port of portList) {
    killPort(port, `port ${port}`);
  }
  for (const port of portList) {
    await waitPortFree(port, `port ${port}`);
  }
}
