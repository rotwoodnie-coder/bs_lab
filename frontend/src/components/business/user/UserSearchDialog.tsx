"use client";

import * as React from "react";
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from "@bs-lab/ui";

import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2SysUserList, type V2SysUserItem } from "@/lib/v2/v2-sys-api";

export type UserSearchSelection = Pick<V2SysUserItem, "userId" | "userName" | "loginName" | "userRoleId" | "roleName" | "userOrgId" | "orgName">;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actor: CoreApiActor;
  title?: string;
  description?: string;
  confirmLabel?: string;
  placeholder?: string;
  initialKeyword?: string;
  onConfirm: (user: UserSearchSelection) => void | Promise<void>;
};

export function UserSearchDialog({ open, onOpenChange, actor, title = "选择用户", description = "输入姓名、账号或手机号搜索后选择。", confirmLabel = "确定选择", placeholder = "输入姓名 / 账号 / 手机号", initialKeyword = "", onConfirm }: Props) {
  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<V2SysUserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");

  const doSearch = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchV2SysUserList(actor, { keyword: keyword.trim(), page: 1, pageSize: 20 });
      setItems(res.items);
      setSelectedUserId((prev) => prev || res.items[0]?.userId || "");
    } finally {
      setLoading(false);
    }
  }, [actor, keyword]);

  React.useEffect(() => {
    if (!open) {
      setKeyword(initialKeyword);
      setItems([]);
      setSelectedUserId("");
      return;
    }
    void doSearch();
  }, [open, doSearch, initialKeyword]);

  const selected = items.find((i) => i.userId === selectedUserId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="flex gap-2">
            <Input value={keyword} placeholder={placeholder} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void doSearch(); }} />
            <Button type="button" variant="outline" onClick={() => void doSearch()} disabled={loading}>{loading ? "搜索中…" : "搜索"}</Button>
          </div>
          <div className="max-h-80 overflow-y-auto rounded border p-2">
            {loading ? <div className="p-3 text-sm text-muted-foreground">搜索中…</div> : items.length === 0 ? <div className="p-3 text-sm text-muted-foreground">暂无结果</div> : items.map((u) => (
              <button key={u.userId} type="button" className={`flex w-full flex-col rounded px-3 py-2 text-left text-sm hover:bg-accent ${selectedUserId === u.userId ? "bg-accent" : ""}`} onClick={() => setSelectedUserId(u.userId)}>
                <span className="flex items-center gap-2 font-medium"><span>{u.userName}</span><Badge variant="outline">{u.roleName ?? u.userRoleId ?? "未分配角色"}</Badge></span>
                <span className="text-xs text-muted-foreground">{u.loginName} · {u.orgName ?? "未分配组织"}</span>
              </button>
            ))}
          </div>
          {selected ? (
            <div className="rounded border bg-muted/30 p-3 text-sm">
              <div>已选：{selected.userName}</div>
              <div className="text-muted-foreground">{selected.loginName} · {selected.roleName ?? selected.userRoleId ?? "未分配角色"}</div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="button" disabled={!selected} onClick={() => selected ? void onConfirm({ userId: selected.userId, userName: selected.userName, loginName: selected.loginName, userRoleId: selected.userRoleId, roleName: selected.roleName, userOrgId: selected.userOrgId, orgName: selected.orgName }) : undefined}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
