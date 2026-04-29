"use client";

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  sonnerToast,
} from "@bs-lab/ui";
import { Camera } from "@bs-lab/ui/icons";

import type { AuthUser } from "@/hooks/use-auth";
import { authRoleToUserRole } from "@/hooks/use-auth";
import { useMediaUpload } from "@/lib/media/gms/use-media-upload";
import { clearV2AuthSession, postV2ChangePassword, postV2Logout, postV2UpdateProfileLogo } from "@/lib/v2/v2-auth-api";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";

type Props = {
  user: AuthUser;
  onSessionCleared: () => void;
};

export function V2AccountPanel({ user, onSessionCleared }: Props) {
  const [oldPwd, setOldPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [avatarBusy, setAvatarBusy] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!user.userId) return null;

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

  const userLogo = user.userLogo;

  const handlePickAvatar = React.useCallback(() => {
    if (avatarBusy) return;
    fileInputRef.current?.click();
  }, [avatarBusy]);

  const handleAvatarFile = React.useCallback(
    async (file: File) => {
      setAvatarBusy(true);
      try {
        const res = await uploadMedia(file, { mediaKind: "image" });
        const fileUrl = (res.result as any)?.fileUrl || res.result.objectKey;
        if (!fileUrl) {
          sonnerToast.error("上传成功但未获取到头像地址");
          return;
        }
        await postV2UpdateProfileLogo(fileUrl);
        sonnerToast.success("头像已更新");
        window.location.reload();
      } catch (e) {
        sonnerToast.error(e instanceof Error ? e.message : "头像更新失败");
      } finally {
        setAvatarBusy(false);
      }
    },
    [uploadMedia],
  );

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) {
      sonnerToast.error("新密码至少 6 位");
      return;
    }
    setBusy(true);
    try {
      await postV2ChangePassword({ oldPwd, newPwd });
      sonnerToast.success("密码已更新");
      setOldPwd("");
      setNewPwd("");
    } catch (err) {
      sonnerToast.error(err instanceof Error ? err.message : "修改失败");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
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
    sonnerToast.success("已退出登录");
    onSessionCleared();
    window.location.href = "/login";
  };

  return (
    <Card className="border-primary/20 bg-primary/[0.03] shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">账户（V2）</CardTitle>
        <CardDescription>数据来自 /v2/auth/profile，与 sys_user 一致。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="group relative"
            onClick={handlePickAvatar}
            aria-label="点击更换头像"
          >
            <Avatar className="size-16 border border-border">
              {userLogo ? <AvatarImage src={materialStorageBrowserHref(userLogo)} alt="头像" /> : null}
              <AvatarFallback className="bg-muted text-sm text-muted-foreground">
                {user.userName?.trim()?.slice(0, 1) || "我"}
              </AvatarFallback>
            </Avatar>
            <span className="pointer-events-none absolute inset-0 rounded-full bg-black/0 transition-colors group-hover:bg-black/15" />
            <span className="pointer-events-none absolute bottom-0 right-0 grid size-6 place-items-center rounded-full border border-border bg-background shadow-sm">
              <Camera className="size-4 text-muted-foreground" />
            </span>
          </button>
          <div className="min-w-0">
            <p className="font-medium text-foreground">头像</p>
            <p className="text-xs text-muted-foreground">
              点击头像即可更换{avatarBusy ? "（上传中…）" : ""}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatarFile(file);
              e.currentTarget.value = "";
            }}
          />
        </div>

        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">姓名</dt>
            <dd className="font-medium text-foreground">{user.userName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">登录名</dt>
            <dd className="font-mono text-foreground">{user.loginName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">组织</dt>
            <dd className="text-foreground">{user.orgName ?? (user.orgId || "—")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">角色</dt>
            <dd className="text-foreground">{user.roleDisplayName ?? user.role}</dd>
          </div>
        </dl>

        <form className="space-y-3 border-t border-border pt-4" onSubmit={handleChangePwd}>
          <p className="font-medium text-foreground">修改密码</p>
          <div className="space-y-2">
            <Label htmlFor="v2-old-pwd">当前密码</Label>
            <Input
              id="v2-old-pwd"
              type="password"
              autoComplete="current-password"
              value={oldPwd}
              onChange={(ev) => setOldPwd(ev.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v2-new-pwd">新密码（至少 6 位）</Label>
            <Input
              id="v2-new-pwd"
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(ev) => setNewPwd(ev.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "提交中…" : "保存新密码"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void handleLogout()}>
              退出登录
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
