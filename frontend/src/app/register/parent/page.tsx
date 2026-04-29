"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, sonnerToast } from "@bs-lab/ui";

import { postV2RegisterParent } from "@/lib/v2/v2-auth-api";

export default function ParentRegisterPage() {
  const router = useRouter();
  const [userName, setUserName] = React.useState("");
  const [loginName, setLoginName] = React.useState("");
  const [userPhone, setUserPhone] = React.useState("");
  const [loginPwd, setLoginPwd] = React.useState("");
  const [loginPwd2, setLoginPwd2] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !loginName.trim() || !loginPwd) {
      sonnerToast.error("请填写必填项");
      return;
    }
    if (loginPwd.length < 6) {
      sonnerToast.error("密码至少 6 位");
      return;
    }
    if (loginPwd !== loginPwd2) {
      sonnerToast.error("两次输入的密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      await postV2RegisterParent({
        userName: userName.trim(),
        loginName: loginName.trim(),
        loginPwd,
        userPhone: userPhone.trim() ? userPhone.trim() : null,
      });
      sonnerToast.success("注册成功，请登录后绑定学生账号");
      router.replace("/login");
    } catch (err) {
      sonnerToast.error(err instanceof Error ? err.message : "注册失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">家长自助注册</CardTitle>
          <CardDescription>注册后需要先绑定至少一个学生账号，并通过学校管理员审核。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="user-name">姓名</Label>
              <Input id="user-name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="请输入姓名" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-name">登录名</Label>
              <Input
                id="login-name"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="用于登录（建议手机号或字母数字组合）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">手机号（可选）</Label>
              <Input
                id="user-phone"
                inputMode="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="用于找回与通知"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd">密码</Label>
              <Input id="pwd" type="password" value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} placeholder="至少 6 位" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd2">确认密码</Label>
              <Input id="pwd2" type="password" value={loginPwd2} onChange={(e) => setLoginPwd2(e.target.value)} placeholder="再次输入密码" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "注册中…" : "注册并返回登录"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              已有账号？{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                去登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

