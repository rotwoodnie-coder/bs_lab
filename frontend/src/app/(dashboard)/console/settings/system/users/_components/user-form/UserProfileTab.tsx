import type { DateRange } from "react-day-picker";

import {
  Avatar,
  AvatarFallback,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
} from "@bs-lab/ui";

import { initials } from "@/lib/console/users/format";
import { formatZhDate } from "@/lib/datetime/format-zh";

export function UserProfileTab(props: {
  editingId: string | null;
  savePending: boolean;
  draftUsername: string;
  onDraftUsernameChange: (v: string) => void;
  draftPassword: string;
  onDraftPasswordChange: (v: string) => void;
  draftStatus: "正常" | "冻结";
  onDraftStatusChange: (v: "正常" | "冻结") => void;
  draftExpireDate: string;
  onDraftExpireDateChange: (v: string) => void;
  draftRealName: string;
  onDraftRealNameChange: (v: string) => void;
  draftNickname: string;
  onDraftNicknameChange: (v: string) => void;
  draftPhone: string;
  onDraftPhoneChange: (v: string) => void;
  draftEmail: string;
  onDraftEmailChange: (v: string) => void;
  orgOptions: { orgId: string; label: string }[];
  draftOrgId: string;
  onDraftOrgIdChange: (v: string) => void;
}) {
  const orgLabel = props.orgOptions.find((o) => o.orgId === props.draftOrgId)?.label ?? "";

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-0">
      {/* 左栏：登录与安全 */}
      <div className="min-w-0 flex-1 space-y-8 lg:pr-10">
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">登录信息</h3>

          <div className="space-y-2">
            <Label htmlFor="username">登录名（login_name）</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="唯一登录名"
              value={props.draftUsername}
              onChange={(e) => props.onDraftUsernameChange(e.target.value)}
              disabled={props.savePending || Boolean(props.editingId)}
            />
            {props.editingId ? (
              <p className="text-xs text-muted-foreground">编辑模式下不可修改登录名，与后端唯一约束一致。</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{props.editingId ? "登录密码（留空则不修改）" : "登录密码"}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={props.editingId ? "留空表示不修改" : "至少 6 位"}
              value={props.draftPassword}
              onChange={(e) => props.onDraftPasswordChange(e.target.value)}
              disabled={props.savePending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-status-switch">账号状态（sys_user.status）</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Switch
                id="user-status-switch"
                checked={props.draftStatus === "正常"}
                onCheckedChange={(v) => props.onDraftStatusChange(v ? "正常" : "冻结")}
                disabled={props.savePending}
                aria-label={
                  props.draftStatus === "正常" ? "当前为正常，关闭开关将冻结账号" : "当前为冻结，打开开关将启用账号"
                }
              />
              <span className="text-sm text-muted-foreground">
                {props.draftStatus === "正常" ? "正常（启用，对应 y）" : "冻结（停用，对应 n）"}
              </span>
            </div>
          </div>
        </section>

        <Separator className="lg:hidden" />

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">账号有效期</h3>
          <p className="text-xs text-muted-foreground">仅设置到期时间，保存后写入 sys_user.expire_date。</p>
          <div className="space-y-2">
            <Label htmlFor="expireDate">到期时间</Label>
            <Input
              id="expireDate"
              type="datetime-local"
              className="w-full max-w-lg"
              value={props.draftExpireDate}
              onChange={(e) => props.onDraftExpireDateChange(e.target.value)}
              disabled={props.savePending}
            />
            <p className="text-xs text-muted-foreground">
              当前选择：{props.draftExpireDate ? formatZhDate(props.draftExpireDate) : "未设置"}
            </p>
          </div>
        </section>
      </div>

      <Separator className="lg:hidden" />

      {/* 右栏：个人与组织 */}
      <div className="min-w-0 flex-1 space-y-4 lg:border-l lg:border-border lg:pl-10">
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">个人资料</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="realName">姓名（user_name）</Label>
              <Input
                id="realName"
                value={props.draftRealName}
                onChange={(e) => props.onDraftRealNameChange(e.target.value)}
                disabled={props.savePending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称（user_nick_name）</Label>
              <Input
                id="nickname"
                value={props.draftNickname}
                onChange={(e) => props.onDraftNicknameChange(e.target.value)}
                disabled={props.savePending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>个人图像</Label>
            <div className="flex items-center gap-3 rounded-md border border-dashed border-border p-3">
              <Avatar className="size-12">
                <AvatarFallback>{initials(props.draftRealName || props.draftNickname || "?")}</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">头像字段后续接入文件服务。</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">电话（user_phone）</Label>
            <Input
              id="phone"
              inputMode="tel"
              value={props.draftPhone}
              onChange={(e) => props.onDraftPhoneChange(e.target.value)}
              disabled={props.savePending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱（user_email）</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={props.draftEmail}
              onChange={(e) => props.onDraftEmailChange(e.target.value)}
              disabled={props.savePending}
            />
          </div>

          <div className="space-y-2">
            <Label>所属组织（user_org_id）</Label>
            <Select
              value={props.draftOrgId || "__none__"}
              onValueChange={(v) => props.onDraftOrgIdChange(v === "__none__" ? "" : v)}
              disabled={props.savePending || props.orgOptions.length === 0}
            >
              <SelectTrigger className="w-full max-w-xl lg:max-w-full">
                <SelectValue placeholder={props.orgOptions.length ? "选择组织" : "暂无组织数据"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未选择</SelectItem>
                {props.orgOptions.map((o) => (
                  <SelectItem key={o.orgId} value={o.orgId}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orgLabel ? (
              <p className="text-xs text-muted-foreground">
                当前路径：<span className="font-mono text-foreground">{orgLabel}</span>
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
