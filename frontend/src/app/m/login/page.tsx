"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileCard } from "@/components/mobile/MobileCard";
import { useMobileContext } from "@/contexts/MobileContext";
import { buildApiUrl } from "@/lib/core-api-shared";

const ROLE_OPTIONS = [
  { id: "parent", label: "家长" },
  { id: "student", label: "学生" },
  { id: "teacher", label: "老师" },
] as const;

type LoginRole = (typeof ROLE_OPTIONS)[number]["id"];

type LoginResponse = {
  success?: boolean;
  data?: {
    has_binding?: boolean;
  };
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(text.trim().startsWith("<html") ? "服务返回了 HTML 页面，请检查代理或接口地址" : text || "服务响应不是 JSON");
  }
  return (await response.json()) as T;
}

function getMockBindingState(role: LoginRole) {
  if (typeof window === "undefined") return role !== "parent";
  if (role !== "parent") return true;
  return window.localStorage.getItem("mock-mobile-parent-bound") === "true";
}

function buildMockLoginResponse(role: LoginRole): LoginResponse {
  const hasBinding = getMockBindingState(role);
  return {
    success: true,
    data: {
      has_binding: hasBinding,
    },
  };
}

export default function MobileLoginPage() {
  const router = useRouter();
  const { refreshUserContext, forceBindingComplete } = useMobileContext();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("parent");
  const [loginName, setLoginName] = useState("parent001");
  const [loginPwd, setLoginPwd] = useState("123456");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl("/v2/auth/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          loginName,
          loginPwd,
          role_id: selectedRole || "parent",
          role: selectedRole,
        }),
      });
      if (!response.ok) {
        throw new Error(response.status === 401 || response.status === 403 ? "账号或密码错误" : `login failed: ${response.status}`);
      }
      const payload = await readJsonResponse<LoginResponse>(response);
      const data = payload.data ?? {};
      if (selectedRole !== "parent" || data.has_binding) forceBindingComplete();
      await refreshUserContext();
      router.push(selectedRole === "parent" && !data.has_binding ? "/m/bind/child" : "/m");
    } catch (error) {
      const message = error instanceof Error ? error.message : "登录失败";
      if (process.env.NODE_ENV === "development" && message.includes("HTML 页面")) {
        console.warn(message);
      } else {
        window.alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <MobileCard title="登录">
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
                </button>
              );
            })}
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
