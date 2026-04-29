"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  sonnerToast,
} from "@bs-lab/ui";
import { Edit3 } from "@bs-lab/ui/icons";

import { ProfileKpiGrid } from "@/app/(dashboard)/profile/_components/profile-kpi-grid";
import { ProfilePageHeader } from "@/app/(dashboard)/profile/_components/profile-page-header";
import { ProfilePageShell } from "@/app/(dashboard)/profile/_components/profile-page-shell";
import { ProfileSettingsNav, ProfileSettingsNavChips, type ProfileSettingsTabKey } from "@/app/(dashboard)/profile/_components/profile-settings-nav";
import { ProfileTabActivity } from "@/app/(dashboard)/profile/_components/profile-tab-activity";
import { ProfileTabGrowth } from "@/app/(dashboard)/profile/_components/profile-tab-growth";
import { ProfileTabOrg } from "@/app/(dashboard)/profile/_components/profile-tab-org";
import { ProfileTabProfile } from "@/app/(dashboard)/profile/_components/profile-tab-profile";
import { ProfileTabSecurity } from "@/app/(dashboard)/profile/_components/profile-tab-security";
import { useAuth } from "@/hooks/use-auth";
import { authRoleToUserRole } from "@/hooks/use-auth";
import { useMediaUpload } from "@/lib/media/gms/use-media-upload";
import { patchV2UpdateProfile, postV2UpdateProfileLogo } from "@/lib/v2/v2-auth-api";

function tabTitle(key: ProfileSettingsTabKey): string {
  switch (key) {
    case "profile":
      return "个人资料";
    case "security":
      return "账号安全";
    case "org":
      return "组织与身份";
    case "growth":
      return "积分与成就";
    case "activity":
      return "活动记录";
    default:
      return "";
  }
}

function tabDesc(key: ProfileSettingsTabKey, editing: boolean): string {
  switch (key) {
    case "profile":
      return editing ? "编辑模式下可修改姓名、联系方式与简介；保存后写入 sys_user。" : "查看与编辑基本信息、联系方式与个人简介。";
    case "security":
      return "登录账号、最近登录与密码安全；不展示敏感口令字段。";
    case "org":
      return "当前会话组织路径、主档归属与权限概览。";
    case "growth":
      return "积分汇总、等级进度与积分流水。";
    case "activity":
      return "系统日志与审计字段（只读）。";
    default:
      return "";
  }
}

export default function ProfilePage() {
  const { user, error: authError, refresh } = useAuth();
  const [active, setActive] = React.useState<ProfileSettingsTabKey>("profile");
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);

  const [draft, setDraft] = React.useState({
    userName: user.userName ?? "",
    userNickName: user.userNickName ?? "",
    userPhone: user.userPhone ?? "",
    userEmail: user.userEmail ?? "",
    prefTitleId: user.prefTitleId ?? "",
    perResume: user.perResume ?? "",
    comments: user.comments ?? "",
  });
  const [saving, setSaving] = React.useState(false);
  const [avatarBusy, setAvatarBusy] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isEditingProfile) return;
    setDraft({
      userName: user.userName ?? "",
      userNickName: user.userNickName ?? "",
      userPhone: user.userPhone ?? "",
      userEmail: user.userEmail ?? "",
      prefTitleId: user.prefTitleId ?? "",
      perResume: user.perResume ?? "",
      comments: user.comments ?? "",
    });
  }, [
    user.comments,
    user.perResume,
    user.prefTitleId,
    user.userEmail,
    user.userName,
    user.userPhone,
    user.userNickName,
    isEditingProfile,
  ]);

  const dirty =
    (draft.userName ?? "").trim() !== (user.userName ?? "").trim() ||
    (draft.userNickName ?? "").trim() !== (user.userNickName ?? "").trim() ||
    (draft.userPhone ?? "") !== (user.userPhone ?? "") ||
    (draft.userEmail ?? "") !== (user.userEmail ?? "") ||
    (draft.prefTitleId ?? "") !== (user.prefTitleId ?? "") ||
    (draft.perResume ?? "") !== (user.perResume ?? "") ||
    (draft.comments ?? "") !== (user.comments ?? "");

  const mediaActor = React.useMemo(() => {
    return {
      role: authRoleToUserRole(user.role),
      userId: user.userId,
      userName: user.userName || user.userId,
      orgId: user.orgId || "",
      tenantId: user.tenantId,
      appId: user.appId,
    };
  }, [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName]);
  const { upload: uploadMedia } = useMediaUpload(mediaActor);

  function onPickAvatar() {
    if (avatarBusy) return;
    fileInputRef.current?.click();
  }

  async function onAvatarFile(file: File) {
    setAvatarBusy(true);
    try {
      const res = await uploadMedia(file, { mediaKind: "image" });
      const fileUrl = (res.result as { fileUrl?: string; objectKey?: string })?.fileUrl || res.result.objectKey;
      if (!fileUrl) {
        sonnerToast.error("上传成功但未获取到头像地址");
        return;
      }
      await postV2UpdateProfileLogo(fileUrl);
      sonnerToast.success("头像已更新");
      await refresh();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "头像更新失败");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onSave() {
    if (!isEditingProfile || !dirty) return;
    const name = draft.userName.trim();
    if (!name) {
      sonnerToast.error("真实姓名不能为空");
      return;
    }
    setSaving(true);
    try {
      await patchV2UpdateProfile({
        userName: name,
        userNickName: draft.userNickName.trim() ? draft.userNickName.trim() : null,
        userPhone: draft.userPhone.trim() ? draft.userPhone.trim() : null,
        userEmail: draft.userEmail.trim() ? draft.userEmail.trim() : null,
        prefTitleId: draft.prefTitleId.trim() ? draft.prefTitleId.trim() : null,
        perResume: draft.perResume.trim() ? draft.perResume.trim() : null,
        comments: draft.comments.trim() ? draft.comments.trim() : null,
      });
      sonnerToast.success("个人资料已保存");
      await refresh();
      setIsEditingProfile(false);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    setDraft({
      userName: user.userName ?? "",
      userNickName: user.userNickName ?? "",
      userPhone: user.userPhone ?? "",
      userEmail: user.userEmail ?? "",
      prefTitleId: user.prefTitleId ?? "",
      perResume: user.perResume ?? "",
      comments: user.comments ?? "",
    });
    setIsEditingProfile(false);
  }

  const schoolName =
    user.sessionOrgPathNodes?.[1]?.orgName ||
    user.recordOrgPathNodes?.[1]?.orgName ||
    user.sessionOrgPathNodes?.[0]?.orgName ||
    user.recordOrgPathNodes?.[0]?.orgName ||
    user.orgName ||
    "";

  const identityBadgeText = `${schoolName || user.orgName || "—"} · ${user.roleDisplayName ?? user.sessionRoleName ?? user.role}`;

  return (
    <div className="-mx-8 flex min-h-[calc(100dvh-4rem)] w-full min-w-0 flex-col bg-slate-50/50 py-5">
      <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-4 px-4 md:px-6 lg:px-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">个人中心</h1>
          <p className="text-base text-muted-foreground">分层摘要与统一设置区。</p>
        </header>

        {authError ? (
          <Card className="rounded-xl border-0 bg-[#ffffff] shadow-sm ring-1 ring-destructive/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-destructive">身份加载提示</CardTitle>
              <CardDescription className="text-destructive/90">{authError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="secondary" size="sm" asChild>
                <Link href="/login">前往登录</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {user.userId ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onAvatarFile(file);
                e.currentTarget.value = "";
              }}
            />

          <ProfilePageShell
            topSlot={
              <ProfilePageHeader
                user={user}
                identityBadgeText={identityBadgeText}
                avatarBusy={avatarBusy}
                onPickAvatar={onPickAvatar}
                onEditProfile={() => {
                  setActive("profile");
                  setIsEditingProfile(true);
                }}
              />
            }
            kpiSlot={<ProfileKpiGrid user={user} />}
          >
            <Card className="flex min-h-0 flex-1 flex-col rounded-xl border-0 bg-white text-base leading-relaxed shadow-sm">
              <CardHeader className="space-y-3 border-b border-slate-100 pb-4">
                <div className="space-y-2 md:hidden">
                  <ProfileSettingsNavChips active={active} onChange={setActive} />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="default" onClick={() => void refresh()}>
                      刷新资料
                    </Button>
                    {active === "profile" ? (
                      isEditingProfile ? (
                        <Button type="button" variant="outline" size="default" onClick={onCancel} disabled={saving}>
                          取消编辑
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="default"
                          className="rounded-lg bg-foreground text-background hover:bg-foreground/90"
                          onClick={() => setIsEditingProfile(true)}
                        >
                          <Edit3 className="mr-2 size-4" />
                          编辑资料
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-xl font-semibold tracking-tight">{tabTitle(active)}</CardTitle>
                    <CardDescription className="text-sm text-slate-600 sm:text-base">{tabDesc(active, isEditingProfile)}</CardDescription>
                  </div>
                  {active === "profile" ? (
                    isEditingProfile ? (
                      dirty ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-900 shadow-sm">未保存</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-muted-foreground shadow-sm">编辑中</span>
                      )
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-muted-foreground shadow-sm">已同步</span>
                    )
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-0 p-0 md:flex-row">
                <aside className="hidden w-64 shrink-0 bg-slate-50/35 md:block md:border-r md:border-slate-200/60">
                  <div className="sticky top-4 space-y-3 p-3">
                    <ProfileSettingsNav active={active} onChange={setActive} />
                    <div className="space-y-2 pt-1">
                      <div className="h-px w-full bg-slate-200/60" aria-hidden />
                      <Button type="button" variant="secondary" size="default" className="w-full" onClick={() => void refresh()}>
                        刷新资料
                      </Button>
                      {active === "profile" ? (
                        isEditingProfile ? (
                          <Button type="button" variant="outline" size="default" className="w-full" onClick={onCancel} disabled={saving}>
                            取消编辑
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="default"
                            size="default"
                            className="w-full rounded-lg bg-foreground text-background hover:bg-foreground/90"
                            onClick={() => setIsEditingProfile(true)}
                          >
                            <Edit3 className="mr-2 size-4" />
                            编辑资料
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 flex-1 p-4 md:p-5 lg:p-6">
                  <div className="w-full min-w-0">
                    <div key={active} className="animate-profile-pane-enter">
                      {active === "profile" ? (
                        <ProfileTabProfile user={user} draft={draft} isEditingProfile={isEditingProfile} onDraft={setDraft} />
                      ) : null}
                      {active === "security" ? <ProfileTabSecurity user={user} /> : null}
                      {active === "org" ? <ProfileTabOrg user={user} /> : null}
                      {active === "growth" ? <ProfileTabGrowth user={user} /> : null}
                      {active === "activity" ? <ProfileTabActivity user={user} /> : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ProfilePageShell>
          </>
        ) : null}
      </div>

      {user.userId && isEditingProfile ? (
        <div className="sticky bottom-0 z-10 -mx-8 bg-slate-50/95 pt-2.5 shadow-[0_-6px_24px_rgba(15,23,42,0.04)] backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1440px] items-center justify-end gap-2 px-4 pb-[env(safe-area-inset-bottom)] pt-0.5 md:px-6 lg:px-8">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              取消
            </Button>
            <Button type="button" className="rounded-lg bg-foreground text-background hover:bg-foreground/90" onClick={() => void onSave()} disabled={!dirty || saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
