import { Badge, Checkbox, Label, RadioGroup, RadioGroupItem, Separator } from "@bs-lab/ui";

import { roleIdToBadgeVariant } from "@/lib/console/users/role-badge";
import type { RoleId } from "@/lib/console/users/types";
import { USER_ROLE_OPTIONS } from "@/lib/console/users/types";

import { MOCK_PERMISSIONS } from "../../user-management.constants";

export function UserPermissionsTab(props: {
  savePending: boolean;
  draftRoleId: RoleId;
  onDraftRoleChange: (id: RoleId) => void;
  draftPermIds: string[];
  onTogglePerm: (permId: string, checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-0">
      <section className="min-w-0 flex-1 space-y-3 lg:max-w-md lg:pr-10">
        <h3 className="text-sm font-medium text-foreground">用户角色（sys_user.user_role_id）</h3>
        <p className="text-sm text-muted-foreground">与 data_role.role_id（迁移自 iam_roles.role_code）一致，单选。</p>

        <RadioGroup
          value={props.draftRoleId}
          onValueChange={(v) => props.onDraftRoleChange(v as RoleId)}
          className="grid gap-2"
          disabled={props.savePending}
        >
          {USER_ROLE_OPTIONS.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
              <RadioGroupItem value={r.id} id={`role-${r.id}`} />
              <Label htmlFor={`role-${r.id}`} className="flex flex-1 cursor-pointer items-center gap-2 font-normal">
                <Badge variant={roleIdToBadgeVariant(r.id)} className="font-normal">
                  {r.label}
                </Badge>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </section>

      <Separator className="lg:hidden" />

      <section className="min-w-0 flex-1 space-y-3 lg:border-l lg:border-border lg:pl-10">
        <h3 className="text-sm font-medium text-foreground">功能权限（占位）</h3>
        <p className="text-sm text-muted-foreground">与 sys_user 无直接字段对应，后续接权限策略服务。</p>

        <div className="grid gap-3 lg:grid-cols-2 lg:gap-3">
          {MOCK_PERMISSIONS.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2">
              <Checkbox
                checked={props.draftPermIds.includes(p.id)}
                onCheckedChange={(c) => props.onTogglePerm(p.id, c === true)}
                disabled={props.savePending}
              />
              <span className="text-sm">{p.label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
