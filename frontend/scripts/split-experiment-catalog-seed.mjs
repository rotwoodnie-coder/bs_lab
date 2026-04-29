/**
 * 一次性将 monolithic experiment-teaching-catalog.seed.ts 拆分为多文件（<300 行/文件）。
 * 若已从 CSV 重新生成单体文件，可先运行本脚本再改回 generate 脚本输出分片。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcPath = path.join(root, "src/data/experiment-teaching-catalog.seed.ts");

const MAX_CHUNK_BODY_LINES = 290;

const text = fs.readFileSync(srcPath, "utf8");
const lines = text.split(/\r?\n/);

const subjectsEnd = lines.findIndex((l, i) => i > 0 && l.trim() === "] as const;" && lines[i - 1]?.includes("catalog-subj-"));
const subjectsBlock = lines.slice(0, subjectsEnd + 1).join("\n");

const rowsDeclIdx = lines.findIndex((l) => l.startsWith("export const EXPERIMENT_CATALOG_SEED_ROWS"));
if (rowsDeclIdx < 0) throw new Error("EXPERIMENT_CATALOG_SEED_ROWS not found");

const rowsCloseIdx = lines.findIndex(
  (l, i) => i > rowsDeclIdx && l.trim() === "] as const;" && lines[i - 1]?.trim().endsWith("},"),
);
if (rowsCloseIdx < 0) throw new Error("closing ] as const for rows not found");

const rowBodyLines = lines.slice(rowsDeclIdx + 1, rowsCloseIdx);
const optionsLines = lines.slice(rowsCloseIdx + 1).filter((l) => l.trim().length > 0);

const dataDir = path.join(root, "src/data");
const subjectsPath = path.join(dataDir, "experiment-teaching-catalog.seed.subjects.ts");
const optionsPath = path.join(dataDir, "experiment-teaching-catalog.seed.options.ts");
const rowsIndexPath = path.join(dataDir, "experiment-teaching-catalog.seed.rows.ts");
const barrelPath = path.join(dataDir, "experiment-teaching-catalog.seed.ts");

const subjectsOut = `${subjectsBlock}\n`;
fs.writeFileSync(subjectsPath, subjectsOut, "utf8");

const optionsOut = `/* eslint-disable max-len */\n${optionsLines.join("\n")}\n`;
fs.writeFileSync(optionsPath, optionsOut, "utf8");

const partPaths = [];
let part = 1;
for (let i = 0; i < rowBodyLines.length; i += MAX_CHUNK_BODY_LINES) {
  const chunk = rowBodyLines.slice(i, i + MAX_CHUNK_BODY_LINES);
  const name = `experiment-teaching-catalog.seed.rows.part-${String(part).padStart(2, "0")}.ts`;
  const fp = path.join(dataDir, name);
  const body = `/* eslint-disable max-len */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";

/** 分片 ${part}（聚合见 experiment-teaching-catalog.seed.rows.ts） */
export const EXPERIMENT_CATALOG_SEED_ROWS_PART_${String(part).padStart(2, "0")} = [
${chunk.join("\n")}
] as const satisfies readonly Omit<CurriculumStandardRow, "id" | "updatedAt">[];
`;
  fs.writeFileSync(fp, body, "utf8");
  partPaths.push({ part, name: name.replace(/\.ts$/, ""), constName: `EXPERIMENT_CATALOG_SEED_ROWS_PART_${String(part).padStart(2, "0")}` });
  part += 1;
}

const importLines = partPaths
  .map((p) => `import { ${p.constName} } from "./${p.name}";`)
  .join("\n");

const spreadLines = partPaths.map((p) => `  ...${p.constName},`).join("\n");

const rowsIndex = `/* eslint-disable max-len */
import type { CurriculumStandardRow } from "@/types/curriculum-standard";
${importLines}

/** 与单体种子文件语义一致：全量目录行（分片拼接） */
export const EXPERIMENT_CATALOG_SEED_ROWS: readonly Omit<CurriculumStandardRow, "id" | "updatedAt">[] = [
${spreadLines}
] as const;
`;

fs.writeFileSync(rowsIndexPath, rowsIndex, "utf8");

const barrel = `export * from "./experiment-teaching-catalog.seed.subjects";
export * from "./experiment-teaching-catalog.seed.rows";
export * from "./experiment-teaching-catalog.seed.options";
`;
fs.writeFileSync(barrelPath, barrel, "utf8");

console.log("Wrote subjects:", subjectsPath);
console.log("Wrote options:", optionsPath);
console.log("Wrote row parts:", partPaths.length);
console.log("Wrote rows index:", rowsIndexPath);
console.log("Wrote barrel:", barrelPath);
