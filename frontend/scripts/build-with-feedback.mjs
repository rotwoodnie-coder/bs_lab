import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const nextCli = path.join(packageRoot, "node_modules", "next", "dist", "bin", "next");
const apiBase = (process.env.NEXT_PUBLIC_NEW_CORE_API_BASE ?? "http://localhost:4100").trim();
const buildTarget = process.env.BUILD_TARGET ?? "next-build";

function stripEnvFileNodeOptions(env = process.env) {
  const nextEnv = { ...env };
  const raw = nextEnv.NODE_OPTIONS;
  if (raw && typeof raw === "string") {
    const kept = raw
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--env-file"));
    if (kept.length) nextEnv.NODE_OPTIONS = kept.join(" ");
    else delete nextEnv.NODE_OPTIONS;
  }
  return nextEnv;
}

function buildFingerprint(stderr, stdout, exitCode) {
  const raw = [buildTarget, String(exitCode ?? 0), stderr.slice(-12000), stdout.slice(-12000)].join("|");
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
}

function classifyBuildFailure(stderr, stdout) {
  const text = `${stdout}\n${stderr}`;
  if (/export .* doesn't exist|does not provide an export named|is not exported from/i.test(text)) return "IMPORT_EXPORT_ERROR";
  if (/Type '\w+' is not assignable|type .* is missing|TypeError:|TS\d{4}/i.test(text)) return "TYPECHECK_ERROR";
  if (/SyntaxError:|Unexpected token|Unexpected identifier/i.test(text)) return "SYNTAX_ERROR";
  if (/React has detected a change in the order of Hooks|Rendered fewer hooks than expected|Invalid hook call/i.test(text)) return "HOOK_RULES_ERROR";
  if (/Module not found|Cannot find module|Can't resolve/i.test(text)) return "MODULE_RESOLUTION_ERROR";
  if (/Turbopack/i.test(text)) return "TURBOPACK_ERROR";
  if (/next\.js version|build error/i.test(text)) return "NEXT_BUILD_ERROR";
  return "BUILD_ERROR";
}

async function submitFeedback(payload) {
  const res = await fetch(`${apiBase}/v2/sys/feedback`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`submit feedback failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

function main() {
  const nextArgs = [nextCli, "build"];
  const child = spawnSync(process.execPath, nextArgs, {
    cwd: packageRoot,
    env: stripEnvFileNodeOptions(),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  const stdout = child.stdout ?? "";
  const stderr = child.stderr ?? "";
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  const exitCode = child.status ?? 1;
  if (exitCode === 0) {
    process.exit(0);
  }

  const combined = `${stdout}\n${stderr}`;
  const isBuildFailure = /build error|next\.js version|turbopack|failed to compile|module not found|export .* doesn't exist|SyntaxError|TypeError|ReferenceError/i.test(combined);
  if (!isBuildFailure) {
    process.exit(exitCode);
  }

  const buildTag = classifyBuildFailure(stderr, stdout);
  const issueFingerprint = buildFingerprint(stderr, stdout, exitCode);
  const title = `Build failure: ${buildTarget}`;
  const content = [
    `## 构建失败`,
    `- buildTag: ${buildTag}`,
    `- target: ${buildTarget}`,
    `- exitCode: ${exitCode}`,
    `- fingerprint: ${issueFingerprint}`,
    "",
    "### stdout",
    "```",
    stdout.slice(-12000),
    "```",
    "",
    "### stderr",
    "```",
    stderr.slice(-12000),
    "```",
  ].join("\n");

  const env = {
    url: `file://${path.join(packageRoot, "package.json")}`,
    ua: `node/${process.version}`,
    browser: "build-time",
    resolution: process.platform,
    pathname: "build",
    errorStack: stderr.slice(-4000),
    error_stack_brief: stderr.split(/\r?\n/).slice(0, 5).join("\n"),
    buildTag,
  };

  submitFeedback({
    type: "BUG",
    title: `${title} [${buildTag}]`,
    content,
    env,
    issueFingerprint,
  })
    .then(() => {
      console.log(`✅ 构建错误已自动上报到 sys_feedback: ${issueFingerprint}`);
    })
    .catch((err) => {
      console.error(`[build-feedback] failed to submit build feedback: ${err instanceof Error ? err.message : String(err)}`);
    })
    .finally(() => process.exit(exitCode));
}

if (!existsSync(nextCli)) {
  console.error(`[build-feedback] next cli not found: ${nextCli}`);
  process.exit(1);
}

main();
