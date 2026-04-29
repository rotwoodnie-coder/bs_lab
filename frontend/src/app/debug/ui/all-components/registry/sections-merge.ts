import type { LabSectionConfig } from "../lab-types";

import { getUiLabSectionsPart1 } from "./sections-part-1";
import { getUiLabSectionsPart2 } from "./sections-part-2";
import { getUiLabSectionsPart3 } from "./sections-part-3";
import { getUiLabSectionsPart4 } from "./sections-part-4";

export const UI_LAB_SECTIONS: LabSectionConfig[] = [
  ...getUiLabSectionsPart1(),
  ...getUiLabSectionsPart2(),
  ...getUiLabSectionsPart3(),
  ...getUiLabSectionsPart4(),
];

export const UI_LAB_NAV_LINKS = UI_LAB_SECTIONS.map((s) => ({
  href: `#${s.id}`,
  label: s.title,
})) as { href: string; label: string }[];
