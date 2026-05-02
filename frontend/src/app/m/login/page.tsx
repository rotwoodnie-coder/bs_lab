"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileCard } from "@/components/mobile/MobileCard";
import { useMobileContext } from "@/contexts/MobileContext";

const ROLE_OPTIONS = [
  { id: "parent", label: "家长", hint: "未绑定时跳转绑定页", defaultHasBinding: false },
  { id: "student", label: "学生", hint: "直接进入移动端", defaultHasBinding: true },
  { id: "teacher", label: "老师", hint: "直接进入移动端", defaultHasBinding: true },
] as const;

type LoginRole = (typeof ROLE_OPTIONS)[number]["id"];

function encodeMockToken(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getParentBindingState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("mock-mobile-parent-bound") === "true";
}

function setMockAuthCookie(role: LoginRole, hasBinding: boolean) {
  const tokenPayload = {
    role_id: role,
    role,
    has_binding: hasBinding,
    login_name: `${role}_mock_user`,
    issued_at: Date.now(),
  };
  const token = `${encodeMockToken(tokenPayload)}.mock-signature`;
  document.cookie = `v2_access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  document.cookie = `v2_refresh_token=mock-refresh-token; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  window.localStorage.setItem("mock-mobile-last-role", role);
  window.localStorage.setItem("mock-mobile-login-role", role);
  if (role === "parent") {
    window.localStorage.setItem("mock-mobile-parent-bound", String(hasBinding));
  }
}

export default function MobileLoginPage() {
  const router = useRouter();
  const { refreshUserContext, forceBindingComplete } = useMobileContext();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("parent");
  const [loginName, setLoginName] = useState("parent001");
  const [loginPwd, setLoginPwd] = useState("123456");
  const [loading, setLoading] = useState(false);

  const activeRoleMeta = useMemo(() => ROLE_OPTIONS.find((item) => item.id === selectedRole) ?? ROLE_OPTIONS[0], [selectedRole]);

  const submit = async () => {
    setLoading(true);
    try {
      const hasBinding = selectedRole === "parent" ? getParentBindingState() : true;
      setMockAuthCookie(selectedRole, hasBinding);
      if (hasBinding) forceBindingComplete();
      await refreshUserContext();
      router.push(selectedRole === "parent" && !hasBinding ? "/m/bind/child" : "/m");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <MobileCard title="登录页" subtitle="使用静态逻辑切换角色，验证 UI 分流">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {ROLE_OPTIONS.map((item) => {
              const active = selectedRole === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedRole(item.id)}
                  className={`rounded-[28px] border px-4 py-5 text-left transition ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-background hover:bg-muted/50"}`}
                >
                  <div className="text-lg font-semibold">{item.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.hint}</div>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl bg-muted/40 p-4 text-sm text-muted-foreground">
            当前选中：<span className="font-semibold text-foreground">{activeRoleMeta.label}</span>。学生/老师直接进入，家长按绑定状态决定是否进入绑定页。
          </div>

          <input className="w-full rounded-2xl border px-4 py-3" value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="登录名" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="space-y-4"
          >
            <input className="w-full rounded-2xl border px-4 py-3" value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} placeholder="密码" type="password" />
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
        </div>
      </MobileCard>
    </div>
  );
}
