"use client";

import * as React from "react";
import { Button, Input } from "@bs-lab/ui";

import type { CoreApiActor } from "@/lib/core-api-shared";

import { UserSearchDialog, type UserSearchSelection } from "./UserSearchDialog";

type Props = {
  actor: CoreApiActor;
  value: UserSearchSelection | null;
  onChange: (next: UserSearchSelection | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export function UserPickerField({ actor, value, onChange, placeholder = "请选择用户", label = "选择用户", disabled }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex gap-2">
      <Input readOnly value={value ? `${value.userName} (${value.loginName})` : ""} placeholder={placeholder} />
      <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={disabled}>{label}</Button>
      <UserSearchDialog
        open={open}
        onOpenChange={setOpen}
        actor={actor}
        title={label}
        description="搜索姓名、账号或手机号后选择。"
        confirmLabel="确定"
        onConfirm={(user) => {
          onChange(user);
          setOpen(false);
        }}
      />
    </div>
  );
}
