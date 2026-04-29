import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@bs-lab/ui";
import type { RoleId } from "./types";

export type RoleBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** 角色 → Badge 语义色（与 @bs-lab/ui Badge variant 对齐） */
export function roleIdToBadgeVariant(id: RoleId): RoleBadgeVariant {
  const map: Record<RoleId, RoleBadgeVariant> = {
    Role_Student: "secondary",
    Role_Parent: "outline",
    Role_Teacher: "science",
    Role_Researcher: "default",
    Role_School_Admin: "warning",
    Role_District_Admin: "management",
    Role_Sys_Admin: "destructive",
  };
  return map[id] ?? "outline";
}
