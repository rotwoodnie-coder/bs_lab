"use client";

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@bs-lab/ui";

import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2SysTeacherList, type V2SysUserItem } from "@/lib/v2/v2-sys-api";

export type UserSearchSelection = Pick<V2SysUserItem, "userId" | "userName" | "loginName" | "userRoleId" | "roleName" | "userOrgId" | "orgName">;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actor: CoreApiActor;
  title?: string;
  description?: string;
  confirmLabel?: string;
  placeholder?: string;
  /** 需要从列表中排除的用户 ID（如已加入成员） */
  excludeUserIds?: string[];
  onConfirm: (user: UserSearchSelection) => void | Promise<void>;
};

const avatarUrl = (u: V2SysUserItem): string | null => u.userLogo ?? null;

function UserAvatar({ user }: { user: V2SysUserItem }) {
  const url = avatarUrl(user);
  return (
    <Avatar className="size-10 shrink-0 border border-border">
      {url ? <AvatarImage src={url} alt={user.userName} /> : null}
      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
        {user.userName.trim().slice(0, 1) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

export function TeacherSearchDialog({ open, onOpenChange, actor, title = "选择教师", description = "搜索教师姓名、账号或手机号。", confirmLabel = "确定选择", placeholder = "输入姓名 / 账号 / 手机号", excludeUserIds, onConfirm }: Props) {
  const [keyword, setKeyword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<V2SysUserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState("");

  const doSearch = React.useCallback(async (kw: string) => {
    setLoading(true);
    try {
      const res = await fetchV2SysTeacherList(actor, kw, 200);
      setItems(res.items);
      setSelectedUserId((prev) => prev || (res.items.length > 0 ? res.items[0]!.userId : ""));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    if (!open) {
      setKeyword("");
      setItems([]);
      setSelectedUserId("");
      return;
    }
    void doSearch("");
  }, [open, doSearch]);

  const selected = items.find((i) => i.userId === selectedUserId) ?? null;

  // 排除已存在成员
  const excludeSet = React.useMemo(() => new Set(excludeUserIds ?? []), [excludeUserIds]);
  const filteredItems = React.useMemo(
    () => items.filter((u) => !excludeSet.has(u.userId)),
    [items, excludeSet],
  );

  // 如果当前选中项被排除，重置选中
  React.useEffect(() => {
    if (selected && excludeSet.has(selected.userId)) {
      setSelectedUserId(filteredItems.length > 0 ? filteredItems[0]!.userId : "");
    }
  }, [selected, excludeSet, filteredItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="flex gap-2">
            <Input
              value={keyword}
              placeholder={placeholder}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void doSearch(keyword);
              }}
            />
            <Button type="button" variant="outline" onClick={() => void doSearch(keyword)} disabled={loading}>
              {loading ? "搜索中…" : "搜索"}
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto rounded border p-2">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">加载中…</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                {keyword.trim() ? "该教师已是教研组成员" : "暂无可选的教师"}
              </div>
            ) : (
              filteredItems.map((u) => (
                <button
                  key={u.userId}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-accent ${
                    selectedUserId === u.userId ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedUserId(u.userId)}
                >
                  <UserAvatar user={u} />
                  <div className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      <span>{u.userName}</span>
                      <Badge variant="outline">{u.roleName ?? u.userRoleId ?? "教师"}</Badge>
                    </span>
                    <div className="truncate text-xs text-muted-foreground">
                      {u.loginName}
                      {u.orgName ? ` · ${u.orgName}` : ""}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {selected ? (
            <div className="flex items-center gap-3 rounded border bg-muted/30 p-3 text-sm">
              <UserAvatar user={selected} />
              <div>
                <div className="truncate font-medium">{selected.userName}</div>
                <div className="text-muted-foreground">
                  {selected.loginName} · {selected.roleName ?? selected.userRoleId ?? "教师"}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={!selected} onClick={() => selected ? void onConfirm({ userId: selected.userId, userName: selected.userName, loginName: selected.loginName, userRoleId: selected.userRoleId, roleName: selected.roleName, userOrgId: selected.userOrgId, orgName: selected.orgName }) : undefined}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
