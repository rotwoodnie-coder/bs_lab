import type { ShowcaseDef } from "./lab-types";

type LabEntryModule = {
  default: ShowcaseDef;
  /** 与 SHOWCASES 的键一致，用于合并进总注册表 */
  LAB_SHOWCASE_KEY: string;
};

/**
 * Next.js + Turbopack 不支持 Vite 的 `import.meta.glob`。
 * 这里改为显式注册，后续新增实验时在此补充静态 import 即可。
 */
const labEntryModules: LabEntryModule[] = [];

/**
 * 合并内置 SHOWCASES 与 `lab-entries/` 下按约定导出的块（无需再改本文件中央映射）。
 */
export function mergeLabShowcases(
  base: Readonly<Record<string, ShowcaseDef>>,
): Record<string, ShowcaseDef> {
  const merged: Record<string, ShowcaseDef> = { ...base };
  for (const mod of labEntryModules) {
    merged[mod.LAB_SHOWCASE_KEY] = mod.default;
  }
  return merged;
}
