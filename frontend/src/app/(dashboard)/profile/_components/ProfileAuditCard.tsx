"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  sonnerToast,
} from "@bs-lab/ui";
import { ChevronDown, Copy, Eye, EyeOff } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { formatDate, formatDateTime, formatNullable } from "./profile-format";
import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS, PROFILE_INSET_SURFACE_CLASS } from "./profile-ui-classes";

export function ProfileAuditCard({ user }: { user: AuthUser }) {
  const [open, setOpen] = React.useState(false);
  const [showUserId, setShowUserId] = React.useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      sonnerToast.success("已复制");
    } catch {
      sonnerToast.error("复制失败");
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={PROFILE_CARD_FLOAT_CLASS}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none pb-2 transition-colors hover:bg-muted/40">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  <ProfileSectionTitle>系统审计</ProfileSectionTitle>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">只读字段（用于追踪与合规）。</CardDescription>
              </div>
              <ChevronDown className={["mt-1 size-4 text-muted-foreground transition-transform", open ? "rotate-180" : ""].join(" ")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid gap-3 pt-0 text-sm sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>用户 ID（只读）</Label>
              <div className={["flex items-center gap-2 p-2", PROFILE_INSET_SURFACE_CLASS].join(" ")}>
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                  {showUserId ? formatNullable(user.userId) : "••••••••••••••••••••"}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setShowUserId((v) => !v)}>
                      {showUserId ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{showUserId ? "隐藏" : "显示"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => void copy(user.userId)}>
                      <Copy className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>复制</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="space-y-2">
              <Label>账号有效期（只读）</Label>
              <Input value={formatDate(user.expireDate)} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>最近登录（只读）</Label>
              <Input value={formatDateTime(user.lastLoginTime)} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>创建人（只读）</Label>
              <Input value={formatNullable(user.createUserId)} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>创建时间（只读）</Label>
              <Input value={formatDateTime(user.createTime)} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>更新人（只读）</Label>
              <Input value={formatNullable(user.updateUserId)} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>更新时间（只读）</Label>
              <Input value={formatDateTime(user.updateTime)} readOnly disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>删除标记（只读）</Label>
              <Input value={user.isDeleted === 1 ? "已删除" : "未删除"} readOnly disabled />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

