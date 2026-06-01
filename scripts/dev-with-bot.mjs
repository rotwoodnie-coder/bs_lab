/**
 * dev-with-bot.mjs — 开发服务器启动器（含 LangGraph Agent 服务）
 *
 * 1. 自动安装 Python 依赖（首次自动 pip install）
 * 2. 启动 Python LangGraph Agent 服务（端口 5001，如未被占用）
 * 3. 启动 pnpm dev（backend + frontend）
 *
 * 适用于 Windows + PowerShell 环境。
 * 使用方法: pnpm dev:full
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { killAndWaitPorts } from "./kill-ports.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");

// ── 端口配置 ──────────────────────────────────────────
// pnpm dev 启动前自动清理以下端口，避免旧进程占用
const PORTS_TO_FREE = [4100, 4200, 4300, 5001];

// ── Agent 服务配置 ────────────────────────────────────
const AGENT_PORT = 5001;

// ── 模块路径 ──────────────────────────────────────────
const AGENTS_SERVICE_DIR = path.join(ROOT, "agents-service");
const isWin = process.platform === "win32";
const MARKER_FILE = path.join(AGENTS_SERVICE_DIR, ".deps_installed");

// ── Python 常见安装路径（Windows） ───────────────────
const COMMON_PYTHON_PATHS = [
  "C:\\Python312\\python.exe",
  "C:\\Python311\\python.exe",
  "C:\\Python310\\python.exe",
  path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python312", "python.exe"),
  path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python311", "python.exe"),
  path.join(process.env.USERPROFILE || "", "AppData", "Local", "Programs", "Python", "Python312", "python.exe"),
  path.join(process.env.USERPROFILE || "", "AppData", "Local", "Programs", "Python", "Python311", "python.exe"),
];

/** 查找可用的 Python 可执行文件路径 */
function resolvePython(env) {
  // 1) 优先使用 .env.local 中显式配置的路径
  if (env.PYTHON_PATH && fs.existsSync(env.PYTHON_PATH)) {
    return env.PYTHON_PATH;
  }
  // 2) 尝试 PATH 中的 python（正常安装时生效）
  try {
    execSync("python --version", { stdio: "pipe", timeout: 3000 });
    return "python";
  } catch {
    /* not in PATH or Windows stub */
  }
  // 3) 扫描常见安装路径
  for (const p of COMMON_PYTHON_PATHS) {
    if (fs.existsSync(p)) {
      console.log(`[agent] 发现 Python: ${p}`);
      return p;
    }
  }
  return null;
}

// ─── 加载 .env.local ──────────────────────────────────────
function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  const env = { ...process.env };
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
      if (!env[key] || env[key].trim() === "") {
        env[key] = value;
      }
    }
  } catch {
    /* .env.local 不存在时静默忽略 */
  }
  return env;
}

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

// ── 自动安装 Python 依赖 ────────────────────────────────
function ensurePythonDeps(pythonBin) {
  if (!pythonBin) {
    console.log("[agent] 未找到 Python，跳过依赖安装");
    return;
  }
  // 如果已安装过且 requirement 未变更，跳过
  if (fs.existsSync(MARKER_FILE)) {
    return;
  }

  const reqFile = path.join(AGENTS_SERVICE_DIR, "pyproject.toml");
  if (!fs.existsSync(reqFile)) {
    console.log("[agent] 未找到 pyproject.toml，跳过 Python 依赖安装");
    return;
  }

  const pipCmd = pythonBin === "python" ? "pip" : path.join(path.dirname(pythonBin), "pip.exe");
  console.log("[agent] 首次启动，正在安装 Python 依赖（pip install）...");
  try {
    execSync(`"${pipCmd}" install -e .`, {
      cwd: AGENTS_SERVICE_DIR,
      stdio: "inherit",
      timeout: 120_000,
      shell: true,
    });
    // 创建标记文件
    fs.writeFileSync(MARKER_FILE, "deps installed\n");
    console.log("[agent] Python 依赖安装完成");
  } catch (err) {
    console.warn("[agent] pip install 失败，跳过依赖自动安装:", err.message);
    console.warn("[agent] 可手动执行: cd agents-service && pip install -e .");
  }
}

// ─── 主流程 ─────────────────────────────────────────────────
async function main() {
  const env = loadEnvLocal();

  // ── 映射 LLM 环境变量（Agent 服务统一使用 LLM_* 字段名）──
  if (!env.LLM_API_KEY) {
    env.LLM_API_KEY = env.AI_CHAT_QWEN_API_KEY || env.DEEPSEEK_API_KEY || "";
  }
  if (!env.LLM_BASE_URL) {
    env.LLM_BASE_URL = env.AI_CHAT_BASE_URL || "https://api.deepseek.com/v1";
  }
  if (!env.LLM_MODEL) {
    env.LLM_MODEL = env.AI_CHAT_MODEL || "deepseek-chat";
  }

  // 告知后端 Agent 服务地址
  if (!env.AGENTS_SERVICE_BASE_URL && !env.STONE_TEACHER_BOT_BASE_URL) {
    env.AGENTS_SERVICE_BASE_URL = `http://localhost:${AGENT_PORT}`;
  }
  // 向后兼容：确保 STONE_TEACHER_BOT_BASE_URL 也有值
  if (!env.STONE_TEACHER_BOT_BASE_URL) {
    env.STONE_TEACHER_BOT_BASE_URL = env.AGENTS_SERVICE_BASE_URL || `http://localhost:${AGENT_PORT}`;
  }

  // ── 清理旧端口进程 ──
  console.log("[dev-with-bot] 正在清理遗留端口进程...");
  await killAndWaitPorts(PORTS_TO_FREE);

  // ── 解析 Python 路径 ──
  const pythonBin = resolvePython(env);
  if (!pythonBin) {
    console.log("[agent] 未找到 Python 可执行文件，跳过 Agent 服务启动");
    console.log("[agent] 可通过 .env.local 配置 PYTHON_PATH=D:\\path\\to\\python.exe");
  } else {
    console.log(`[agent] 使用 Python: ${pythonBin}`);
  }

  // ── 自动安装 Python 依赖 ──
  ensurePythonDeps(pythonBin);

  const children = [];
  let cleaningUp = false;

  function cleanup(code = 0) {
    if (cleaningUp) return;
    cleaningUp = true;
    for (const c of children) {
      try { c.kill(); } catch { /* already dead */ }
    }
    // 强制转数字，防止信号处理器或 exit 事件传入字符串
    const safeCode = typeof code === "number" && Number.isFinite(code) && code >= 0 ? Math.floor(code) : 0;
    // 使用箭头函数确保 this 绑定正确，Number() 二次兜底
    setTimeout(() => { process.exit(Number(safeCode)); }, 2000);
  }

  // 信号事件处理器：忽略信号参数，用数字 0 退出
  process.on("SIGINT", () => cleanup(0));
  process.on("SIGTERM", () => cleanup(0));

  // ── 1. 启动 LangGraph Agent 服务 ──
  const agentBusy = await isPortInUse(AGENT_PORT);
  if (agentBusy) {
    console.log(`[agent] 端口 ${AGENT_PORT} 已被占用，跳过 Agent 服务启动`);
  } else if (!pythonBin) {
    console.log(`[agent] 无 Python 环境，跳过 Agent 服务启动`);
  } else {
    const agentArgs = ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", String(AGENT_PORT), "--log-level", "info", "--no-access-log"];
    const agent = spawn(pythonBin, agentArgs, { cwd: AGENTS_SERVICE_DIR, stdio: "inherit", env });
    agent.on("exit", (code) => {
      if (code !== 0 && code !== null && !cleaningUp) {
        console.log(`[agent] LangGraph Agent 服务异常退出 (code=${code})`);
      }
    });
    children.push(agent);
    console.log(`[agent] LangGraph Agent 服务启动中 → http://localhost:${AGENT_PORT}`);
  }

  // ── 2. 启动 backend + frontend（等同原 pnpm dev）──
  // Windows: cmd.exe /c "pnpm ..." 避免 shell:true + args 的 DeprecationWarning
  // Unix: 直接 spawn pnpm
  const pnpmCmd = isWin ? "pnpm.cmd" : "pnpm";
  const pnpmArgs = ["--parallel", "--filter", "new-core-backend", "--filter", "new-core-frontend", "run", "dev"];
  const pnpm = isWin
    ? spawn("cmd.exe", ["/c", [pnpmCmd, ...pnpmArgs].join(" ")], { cwd: ROOT, stdio: "inherit", env })
    : spawn(pnpmCmd, pnpmArgs, { cwd: ROOT, stdio: "inherit", env });
  pnpm.on("exit", (code) => {
    cleanup(code ?? 0);
  });
  children.push(pnpm);

  console.log("[dev-with-bot] 所有服务已启动，按 Ctrl+C 停止");
}

main().catch((err) => {
  console.error("[dev-with-bot] 启动失败:", err);
  process.exit(1);
});
