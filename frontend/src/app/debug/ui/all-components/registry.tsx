"use client";

/**
 * UI Lab 展示注册表（Living Styleguide）
 *
 * 实现已拆至 `./registry/` 子目录，单文件遵守 &lt;300 行门禁。
 *
 * 【自动同步约束】修改 `packages/ui` 或本页引用组件后，须同步 `living-docs.ts` 与 `/debug/ui/all-components`。
 *
 * 新增原子组件：在 `registry/showcases-part-*.tsx` 的 `SHOWCASES_*` 中补充，或仅在 `lab-entries/*.tsx`
 * 按 `registry.loader.ts` 约定导出；并在 `registry/sections-part-*.tsx` 中挂入 `items`。
 */
import type { ShowcaseDef } from "./lab-types";
import type { ShowcaseName } from "./registry/showcases-merge";
import { mergeLabShowcases } from "./registry.loader";
import { SHOWCASES_BASE } from "./registry/showcases-merge";
import { ShowcaseBlock as ShowcaseBlockView } from "./registry/showcase-block";

export type {
  DateRangePickerValue,
  LabSectionConfig,
  LabSectionItem,
  UiLabContext,
} from "./lab-types";
export type { ShowcaseName } from "./registry/showcases-merge";

export { COMBOBOX_OPTIONS } from "./registry/lab-constants";
export { PropsDocBlock } from "./registry/props-doc-block";
export { SHOWCASES_BASE } from "./registry/showcases-merge";
export { UI_LAB_NAV_LINKS, UI_LAB_SECTIONS } from "./registry/sections-merge";

export const SHOWCASES = mergeLabShowcases(SHOWCASES_BASE);

export function ShowcaseBlock(props: { name: ShowcaseName | string }) {
  return <ShowcaseBlockView {...props} showcases={SHOWCASES as Record<string, ShowcaseDef>} />;
}
