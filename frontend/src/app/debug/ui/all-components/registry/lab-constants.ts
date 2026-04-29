import type { VariantProps } from "class-variance-authority";
import { badgeVariants, buttonVariants } from "./lab-ui";

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "destructive",
  "success",
  "warning",
  "ghost",
  "link",
] as const satisfies readonly ButtonVariant[];

export const BUTTON_VARIANT_LABELS: Record<ButtonVariant, string> = {
  default: "Primary",
  secondary: "Secondary",
  outline: "Outline",
  destructive: "Destructive",
  success: "Success",
  warning: "Warning",
  ghost: "Ghost",
  link: "Link",
};

export const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "destructive",
  "success",
  "warning",
  "science",
  "management",
] as const satisfies readonly BadgeVariant[];

export const BADGE_LABELS: Record<BadgeVariant, string> = {
  default: "Default",
  secondary: "Secondary",
  outline: "Outline",
  destructive: "Destructive",
  success: "Success",
  warning: "Warning",
  science: "Science",
  management: "Management",
};

export const ALERT_VARIANTS = ["default", "destructive"] as const;

export const COMBOBOX_OPTIONS = [
  { value: "mechanics", label: "力学与测量", group: "高一" },
  { value: "electro", label: "电磁感应", group: "高二" },
  { value: "optic", label: "光学与波动", group: "高二" },
  { value: "modern", label: "近代物理", group: "高三" },
] as const;
