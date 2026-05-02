import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";

const backendPort = Number(process.env.BACKEND_DEV_PORT ?? process.env.PORT_BACKEND ?? 4100);
const frontendPort = Number(process.env.FRONTEND_DEV_PORT ?? process.env.PORT_FRONTEND ?? 4200);
const extraPort = 4300;
const portsToFree = [backendPort, frontendPort, extraPort];

function killPortWindows(port, label = `port ${port}`) {
  const script = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    `$pids = @(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)`,
    "if (-not $pids -or $pids.Count -eq 0) {",
    `  $pids = @(netstat -ano | Select-String ":${port}\\s" | ForEach-Object { ($_ -split '\\s+')[-1] } | Where-Object { $_ -match '^[0-9]+$' } | Select-Object -Unique)`,
    "}",
    "if (-not $pids -or $pids.Count -eq 0) {",
    `  $patterns = @('next dev', 'next-server', 'ts-node', 'tsx', 'src/http/server.ts', 'scripts/dev-entry.mjs')`,
    `  $cmdMatch = @()`,
    `  foreach ($pattern in $patterns) {`,
    `    $cmdMatch += @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -match $pattern } | Select-Object -ExpandProperty ProcessId)`,
    `  }`,
    `  $pids = @($cmdMatch | Select-Object -Unique)`,
    `  if ($pids -and $pids.Count -gt 0) { Write-Host \"[dev:fresh] ${label}: matched fallback process command lines on ${port}\" }`,
    "}",
    "foreach ($pid in $pids) {",
    "  if ($pid) {",
    "    try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}",
    "    try { taskkill /PID $pid /F /T | Out-Null } catch {}",
    "  }",
    "}",
  ].join("; ");
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { stdio: "inherit" },
  );
  if (result.error) {
    console.error(`[dev:fresh] failed to run PowerShell for port ${port}:`, result.error.message);
  }
}

function killPortUnix(port) {
  try {
    execSync(`fuser -k -9 ${port}/tcp`, { stdio: "pipe" });
    return;
  } catch {
    try {
      const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, { encoding: "utf8" }).trim();
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

function freePort(port, label = `port ${port}`) {
  console.log(`[dev:fresh] force-killing listeners on ${label}...`);
  if (process.platform === "win32") {
    killPortWindows(port, label);
  } else {
    killPortUnix(port);
  }
}

function waitPortFree(port, label) {
  const maxWait = 5000;
  const interval = 300;
  let waited = 0;
  while (waited < maxWait) {
    try {
      const out = process.platform === "win32"
        ? execSync(
            `powershell.exe -NoProfile -NonInteractive -Command "& { (Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Measure-Object).Count }"`,
            { encoding: "utf8", stdio: "pipe" },
          ).trim()
        : execSync(`lsof -tiTCP:${port}`, { encoding: "utf8", stdio: "pipe" }).trim();
      if (!out || out === "0") {
        console.log(`[dev:fresh] ${label} port ${port} is free after ${waited}ms`);
        return true;
      }
    } catch {
      console.log(`[dev:fresh] ${label} port ${port} is free`);
      return true;
    }
    waited += interval;
    spawnSync(process.platform === "win32" ? "timeout" : "sleep", [String(interval / 1000)], { stdio: "ignore" });
  }
  console.error(`[dev:fresh] WARNING: ${label} port ${port} still occupied after ${maxWait}ms, proceeding anyway...`);
  return false;
}

const repoRoot = new URL("..", import.meta.url);
const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

// 仅清理指定端口
for (const port of portsToFree) {
  freePort(port);
}

// 再次检查并强制清理一轮，避免残留进程占口
for (const port of portsToFree) {
  waitPortFree(port, `port ${port}`);
  freePort(port);
}

// 等待端口释放完毕
for (const port of portsToFree) {
  waitPortFree(port, `port ${port}`);
}

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

if (!process.env.SKIP_AUDIT_HEAL) {
  const auditResult = spawnSync(pnpmCmd, ["audit:heal"], {
    stdio: "inherit",
    cwd: repoRoot,
    shell: process.platform === "win32",
  });
  if ((auditResult.status ?? 1) !== 0) {
    console.error("[dev:fresh] audit:heal failed, continuing to start dev servers...");
  }
}

const result = spawnSync(pnpmCmd, ["dev"], {
  stdio: "inherit",
  cwd: repoRoot,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
