"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, sonnerToast } from "@bs-lab/ui";

import { fetchV2Profile, postV2Login, writeV2AuthSession } from "@/lib/v2/v2-auth-api";

function safeRedirectPath(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value === "/login" || value.startsWith("/login?") || value.startsWith("/login/")) return "/";
  return value;
}

function resolveRedirectByRole(roleName: string | null | undefined): string {
  const r = String(roleName ?? "");
  if (r === "Role_Sys_Admin" || r === "Role_School_Admin" || r === "Role_District_Admin") return "/system-manage/teacher-class";
  if (r === "Role_Researcher") return "/console/settings/experiments";
  if (r === "Role_Teacher") return "/experiment-manage";
  if (r === "Role_Student") return "/experiments";
  if (r === "Role_Parent") return "/profile/family";
  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("next"));
  const [loginName, setLoginName] = React.useState("");
  const [loginPwd, setLoginPwd] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim() || !loginPwd) {
      sonnerToast.error("请填写用户名和密码");
      return;
    }
    setSubmitting(true);
    try {
      const loginRes = await postV2Login({ loginName: loginName.trim(), loginPwd });
      // 立即写入本地会话，避免 AuthGate / RBAC 组件在首帧拿不到角色。
      writeV2AuthSession({
        userId: loginRes.userId,
        loginName: loginRes.loginName,
        userRoleId: loginRes.userRoleId,
        userOrgId: loginRes.userOrgId,
        userName: loginRes.userName,
      });
      const profile = await fetchV2Profile();
      sonnerToast.success("登录成功");
      // 家长已审核通过后，跳转到家长门户首页而非绑定页
      const target = (() => {
        const roleId = profile.userRoleId ?? loginRes.userRoleId;
        if (roleId === "Role_Parent") {
          const approvedCount = Number((profile as any).parentBindingSummary?.approvedCount ?? 0);
          if (approvedCount > 0) return "/parent/lab";
        }
        return resolveRedirectByRole(roleId);
      })();
      router.replace(target);
      router.refresh();
    } catch (err) {
      sonnerToast.error(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">系统登录</CardTitle>
          <CardDescription>
            使用现有账号登录，登录成功后进入系统并继续执行权限控制。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="login-name">用户名</Label>
              <Input
                id="login-name"
                name="loginName"
                autoComplete="username"
                placeholder="请输入登录名"
                value={loginName}
                onChange={(ev) => setLoginName(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-pwd">密码</Label>
              <Input
                id="login-pwd"
                name="loginPwd"
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={loginPwd}
                onChange={(ev) => setLoginPwd(ev.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "登录中…" : "登录进入系统"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              登录后将根据角色自动分流；
              <span className="ml-1 font-medium text-foreground">{redirectTo}</span>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/experiment-manage" className="text-primary underline-offset-4 hover:underline">
                返回工作台
              </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              还没有账号？{" "}
              <Link href="/register/parent" className="text-primary underline-offset-4 hover:underline">
                家长自助注册
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
