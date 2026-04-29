"use client";

import { Badge } from "@bs-lab/ui";
import type { AuthRole } from "../page.types";

const ROLE_LABEL: Record<AuthRole, string> = {
  Role_Sys_Admin: "系统管理员",
  Role_District_Admin: "区管理员",
  Role_School_Admin: "学校管理员",
  Role_Researcher: "教研员",
  Role_Teacher: "教师",
  Role_Student: "学生",
  Role_Parent: "家长",
};

const ROLE_VARIANT: Record<AuthRole, "default" | "secondary" | "destructive" | "outline"> = {
  Role_Sys_Admin: "destructive",
  Role_District_Admin: "outline",
  Role_School_Admin: "secondary",
  Role_Researcher: "outline",
  Role_Teacher: "default",
  Role_Student: "secondary",
  Role_Parent: "outline",
};

export function RoleHeaderBadge({ role }: { role: AuthRole }) {
  return (
    <Badge variant={ROLE_VARIANT[role]} className="justify-center text-xs font-normal">
      {ROLE_LABEL[role]}
    </Badge>
  );
}
