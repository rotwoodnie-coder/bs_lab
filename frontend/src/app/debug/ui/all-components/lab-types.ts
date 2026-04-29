import type { ComponentProps, Dispatch, SetStateAction } from "react";
import type { DateRangePicker } from "@bs-lab/ui";

export type DateRangePickerValue = ComponentProps<typeof DateRangePicker>["date"];

export type UiLabContext = {
  comboValue: string | undefined;
  setComboValue: Dispatch<SetStateAction<string | undefined>>;
  range: DateRangePickerValue;
  setRange: Dispatch<SetStateAction<DateRangePickerValue>>;
  calDate: Date | undefined;
  setCalDate: Dispatch<SetStateAction<Date | undefined>>;
  selectValue: string;
  setSelectValue: Dispatch<SetStateAction<string>>;
  radioValue: string;
  setRadioValue: Dispatch<SetStateAction<string>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  tabSwUnderline: string;
  setTabSwUnderline: Dispatch<SetStateAction<string>>;
  tabSwPill: string;
  setTabSwPill: Dispatch<SetStateAction<string>>;
  tabSwSidebar: string;
  setTabSwSidebar: Dispatch<SetStateAction<string>>;
};

export type ShowcasePreset = { key: string; render: () => import("react").ReactNode };

export type ShowcaseDef = {
  label: string;
  /** 开发参考：支持的 props 简要说明（与 @bs-lab/ui 源码对齐维护） */
  propsDoc: string;
  /** 包裹所有 preset 输出的容器 */
  rowClassName?: string;
  presets: readonly ShowcasePreset[];
};

export type LabSectionItem =
  | { kind: "showcase"; name: string }
  | {
      kind: "custom";
      id: string;
      label: string;
      render: (ctx: UiLabContext) => import("react").ReactNode;
    };

export type LabSectionConfig = {
  id: string;
  title: string;
  description: string;
  stackClassName?: string;
  items: readonly LabSectionItem[];
};
