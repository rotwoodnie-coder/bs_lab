import type { ShowcaseDef } from "../lab-types";

import { SHOWCASES_PART_A } from "./showcases-part-a";
import { SHOWCASES_PART_B } from "./showcases-part-b";

export const SHOWCASES_BASE = {
  ...SHOWCASES_PART_A,
  ...SHOWCASES_PART_B,
} satisfies Record<string, ShowcaseDef>;

export type ShowcaseName = keyof typeof SHOWCASES_BASE;
