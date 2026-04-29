import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, resolve } from "node:path";
import process from "node:process";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ALLOWED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORE_PARTS = ["node_modules", ".next", "dist", "coverage", ".turbo", ".git"];
const CHECK_ROOTS = ["frontend/src", "packages/ui/src"];

const HARD_FILE_LIMIT = 300;
const WARN_FILE_LIMIT = 500;
const FUNC_LIMIT = 60;

function run(command) {
  return execSync(command, { cwd: ROOT, encoding: "utf8" }).trim();
}

function getTrackedFiles() {
  const out = run("git ls-files");
  return out.split(/\r?\n/).filter(Boolean);
}

function getChangedFiles() {
  const out = run("git diff --name-only --cached");
  return out.split(/\r?\n/).filter(Boolean);
}

function shouldCheck(relPath) {
  if (!CHECK_ROOTS.some((prefix) => relPath.startsWith(prefix))) return false;
  if (!ALLOWED_EXTS.has(extname(relPath))) return false;
  return !IGNORE_PARTS.some((part) => relPath.includes(`/${part}/`) || relPath.includes(`\\${part}\\`));
}

function normalizeContent(content) {
  return content.replace(/\r\n/g, "\n");
}

function lineCount(content) {
  if (!content) return 0;
  return content.split("\n").length;
}

function getLineNumber(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function collectFunctionFindings(relPath, content, findings) {
  const patterns = [
    /\bfunction\s+([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/g,
    /\bconst\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g,
    /\bexport\s+default\s+function\s+([A-Za-z0-9_$]+)?\s*\([^)]*\)\s*\{/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const name = match[1] || "anonymous";
      const start = match.index ?? 0;
      const openBrace = content.indexOf("{", start);
      if (openBrace === -1) continue;

      let depth = 0;
      let end = -1;
      for (let i = openBrace; i < content.length; i += 1) {
        const ch = content[i];
        if (ch === "{") depth += 1;
        if (ch === "}") depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
      if (end === -1) continue;

      const startLine = getLineNumber(content, start);
      const endLine = getLineNumber(content, end);
      const length = endLine - startLine + 1;
      if (length > FUNC_LIMIT) {
        findings.push({
          level: "ERROR",
          code: "FUNC_MAX_60",
          path: relPath,
          detail: `"${name}" is ${length} lines (max ${FUNC_LIMIT})`,
        });
      }
    }
  }
}

/** 标准封装内允许原生 `<video>` / `<img>`（其它业务路径仍禁止裸写） */
const NATIVE_MEDIA_TAG_ALLOWLIST = new Set([
  "frontend/src/components/business/video/ExpVideoPlayer.tsx",
]);

function collectMediaTagFindings(relPath, content, findings) {
  const norm = relPath.replace(/\\/g, "/");
  const strongPaths = [
    "frontend/src/app/",
    "frontend/src/components/business/",
  ];
  if (!strongPaths.some((prefix) => norm.startsWith(prefix))) return;
  if (NATIVE_MEDIA_TAG_ALLOWLIST.has(norm)) return;

  const tags = [
    { regex: /<\s*video\b/i, label: "<video>" },
    { regex: /<\s*audio\b/i, label: "<audio>" },
    { regex: /<\s*img\b/i, label: "<img>" },
    { regex: /<\s*input\b[^>]*type\s*=\s*["']file["']/i, label: "<input type=\"file\">" },
  ];

  for (const tag of tags) {
    if (tag.regex.test(content)) {
      findings.push({
        level: "ERROR",
        code: "NATIVE_MEDIA_TAG",
        path: relPath,
        detail: `found native media tag ${tag.label}`,
      });
    }
  }
}

function collectVideoNamingFindings(relPath, content, findings) {
  const declaration = /\b(?:export\s+)?(?:const|function|class|interface|type)\s+([A-Za-z0-9_$]+)/g;
  const keyword = /(Video|video|Media|media|Upload|upload|Playback|playback)/;
  const allowedPrefix = /^(VideoManager|StandardVideo)/;

  for (const match of content.matchAll(declaration)) {
    const name = match[1];
    if (!keyword.test(name)) continue;
    if (allowedPrefix.test(name)) continue;

    findings.push({
      level: "ERROR",
      code: "VIDEO_NAMING_PREFIX",
      path: relPath,
      detail: `"${name}" should start with VideoManager or StandardVideo`,
    });
  }
}

function collectNoMockRuntimeFindings(relPath, content, findings) {
  const normalized = relPath.replace(/\\/g, "/");
  if (!normalized.startsWith("frontend/src/")) return;
  if (normalized.includes("/test-fixtures/")) return;
  if (normalized.includes("/__tests__/") || normalized.endsWith(".test.ts") || normalized.endsWith(".test.tsx")) return;

  const forbiddenPatterns = [
    { regex: /from\s+["'][^"']*\/mocks\/[^"']*["']/g, detail: "runtime code should not import from /mocks/" },
    { regex: /\bfallback[A-Za-z0-9_]+\s*\(/g, detail: "runtime code should not call fallback* helpers" },
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.regex.test(content)) {
      findings.push({
        level: "ERROR",
        code: "NO_RUNTIME_MOCK_FALLBACK",
        path: relPath,
        detail: pattern.detail,
      });
    }
  }
}

function collectFileLengthFindings(relPath, content, findings) {
  const lines = lineCount(content);
  if (lines > WARN_FILE_LIMIT) {
    findings.push({
      level: "ERROR",
      code: "FILE_MAX_500",
      path: relPath,
      detail: `${lines} lines (must not exceed legacy warning cap ${WARN_FILE_LIMIT})`,
    });
    return;
  }
  if (lines > HARD_FILE_LIMIT) {
    findings.push({
      level: "ERROR",
      code: "FILE_MAX_300",
      path: relPath,
      detail: `${lines} lines (hard limit ${HARD_FILE_LIMIT})`,
    });
  }
}

function main() {
  const onlyChanged = process.argv.includes("--changed");
  const candidates = onlyChanged ? getChangedFiles() : getTrackedFiles();
  const files = candidates.filter(shouldCheck);
  const findings = [];

  for (const relPath of files) {
    const absPath = resolve(ROOT, relPath);
    const content = normalizeContent(readFileSync(absPath, "utf8"));
    collectFileLengthFindings(relPath, content, findings);
    collectFunctionFindings(relPath, content, findings);
    collectMediaTagFindings(relPath, content, findings);
    collectVideoNamingFindings(relPath, content, findings);
    collectNoMockRuntimeFindings(relPath, content, findings);
  }

  if (findings.length === 0) {
    console.log("[guardrails] PASS - no violations found.");
    process.exit(0);
  }

  console.error(`[guardrails] FAIL - ${findings.length} violation(s):`);
  for (const item of findings) {
    console.error(`${item.level} [${item.code}] ${item.path}: ${item.detail}`);
  }
  process.exit(1);
}

main();
