#!/usr/bin/env node
/**
 * 简易版本号递增脚本
 *
 * 用法:
 *   node scripts/bump-version.mjs          # patch +1（默认）
 *   node scripts/bump-version.mjs minor    # minor +1
 *   node scripts/bump-version.mjs major    # major +1
 *
 * 读取项目根目录 VERSION 文件，递增后写回，并自动 git commit。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VERSION_FILE = resolve(__dirname, "../VERSION");
const bumpType = (process.argv[2] || "patch").toLowerCase();

let current;
try {
  current = readFileSync(VERSION_FILE, "utf-8").trim();
} catch {
  current = "0.0.0";
}

const parts = current.split(".").map((s) => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
});
while (parts.length < 3) parts.push(0);

if (bumpType === "major") {
  parts[0] += 1;
  parts[1] = 0;
  parts[2] = 0;
} else if (bumpType === "minor") {
  parts[1] += 1;
  parts[2] = 0;
} else {
  parts[2] += 1;
}

const next = parts.join(".");
writeFileSync(VERSION_FILE, next + "\n", "utf-8");
console.log(`  ${current} → ${next}`);

try {
  execSync(`git add "${VERSION_FILE}" && git commit -m "chore: bump version to ${next}"`, { stdio: "inherit" });
  console.log("  已提交");
} catch {
  console.log("  ⚠ git commit 失败，请手动提交");
}
