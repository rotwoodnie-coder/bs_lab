"use client";

import * as React from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, sonnerToast } from "@bs-lab/ui";
import { Lock, ShieldCheck } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { clearV2AuthSession, postV2ChangePassword, postV2Logout } from "@/lib/v2/v2-auth-api";

import { formatDate, formatDateTime, formatNullable } from "./profile-format";
import { ProfileSectionTitle } from "./profile-section-title";
import { PROFILE_CARD_FLOAT_CLASS } from "./profile-ui-classes";

export function ProfileTabSecurity({ user }: { user: AuthUser }) {
  const [oldPwd, setOldPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [pwdBusy, setPwdBusy] = React.useState(false);

  const accountStatusLabel =
    user.status?.toLowerCase() === "y" ? "正常" : user.status?.toLowerCase() === "n" ? "禁用" : formatNullable(user.status);

  async function onLogout() {
    try {
      await postV2Logout();
    } catch {
      /* ignore */
    }
    clearV2AuthSession();
    try {
      new BroadcastChannel("auth").postMessage({ type: "logout" });
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }

  return (
    <div className="space-y-3">
      <Card className={PROFILE_CARD_FLOAT_CLASS}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            <ProfileSectionTitle icon={ShieldCheck}>账号状态</ProfileSectionTitle>
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">状态与有效期为只读字段。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-base sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm text-slate-600">账号状态（只读）</Label>
            <Input className="text-base" value={accountStatusLabel} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-600">有效期（只读）</Label>
            <Input className="text-base" value={formatDate(user.expireDate)} readOnly disabled />
          </div>
        </CardContent>
      </Card>

      <Card className={PROFILE_CARD_FLOAT_CLASS}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            <ProfileSectionTitle icon={Lock}>登录与安全</ProfileSectionTitle>
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            展示最近登录与登录账号；login_pwd 不在任何界面展示。可在此修改密码或退出登录。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-base">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">登录账号（只读）</Label>
              <Input className="text-base" value={formatNullable(user.loginName)} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">最近登录（last_login_time）</Label>
              <Input className="text-base" value={formatDateTime(user.lastLoginTime)} readOnly disabled />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-tab-oldPwd" className="text-sm text-slate-600">
                当前密码
              </Label>
              <Input
                id="profile-tab-oldPwd"
                className="text-base"
                type="password"
                autoComplete="current-password"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-tab-newPwd" className="text-sm text-slate-600">
                新密码（至少 6 位）
              </Label>
              <Input
                id="profile-tab-newPwd"
                className="text-base"
                type="password"
                autoComplete="new-password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pwdBusy}
              onClick={() => {
                void (async () => {
                  if (newPwd.length < 6) {
                    sonnerToast.error("新密码至少 6 位");
                    return;
                  }
                  setPwdBusy(true);
                  try {
                    await postV2ChangePassword({ oldPwd, newPwd });
                    sonnerToast.success("密码已更新");
                    setOldPwd("");
                    setNewPwd("");
                  } catch (e) {
                    sonnerToast.error(e instanceof Error ? e.message : "修改失败");
                  } finally {
                    setPwdBusy(false);
                  }
                })();
              }}
            >
              {pwdBusy ? "提交中…" : "修改密码"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void onLogout()}>
              退出登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
