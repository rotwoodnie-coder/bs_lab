"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
} from "@bs-lab/ui";

import { useAuth } from "@/hooks/use-auth";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { clearV2AuthSession, postV2Logout } from "@/lib/v2/v2-auth-api";
import {
  fetchMyBindings,
  fetchParentClasses,
  fetchParentGrades,
  postBindApply,
  postVerifyStudent,
  type MyBindingRow,
  type OrgLite,
  type VerifyStudentCandidate,
} from "@/lib/v2/v2-parent-binding-api";
import { UserRole } from "@/types/auth";

import { FamilySchoolTreeSelect } from "./FamilySchoolTreeSelect";

export default function ProfileFamilyPage() {
  const auth = useAuth();
  const role = auth.user.role;
  const actor = React.useMemo(
    () => ({
      role: role as any,
      userId: auth.user.userId,
      userName: auth.user.userName || auth.user.userId,
      orgId: auth.user.orgId || "",
      tenantId: auth.user.tenantId,
      appId: auth.user.appId,
    }),
    [auth.user.appId, auth.user.orgId, auth.user.role, auth.user.tenantId, auth.user.userId, auth.user.userName, role],
  );

  const [grades, setGrades] = React.useState<OrgLite[]>([]);
  const [classes, setClasses] = React.useState<OrgLite[]>([]);
  const [schoolOrgId, setSchoolOrgId] = React.useState<string>("");
  const [gradeOrgId, setGradeOrgId] = React.useState<string>("");
  const [classOrgId, setClassOrgId] = React.useState<string>("");
  const [studentName, setStudentName] = React.useState("");
  const [candidates, setCandidates] = React.useState<VerifyStudentCandidate[]>([]);
  const [selectedStudentUserId, setSelectedStudentUserId] = React.useState<string>("");
  const [myBindings, setMyBindings] = React.useState<MyBindingRow[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!auth.user.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const mine = await fetchMyBindings(actor);
        if (cancelled) return;
        setMyBindings(mine);
      } catch (e) {
        if (cancelled) return;
        sonnerToast.error(e instanceof Error ? e.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, auth.user.userId]);

  if (role !== UserRole.PARENT && !isSuperUserRole(role)) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        当前页面仅对家长账号开放。
      </div>
    );
  }

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

  const refreshMine = async () => {
    const mine = await fetchMyBindings(actor);
    setMyBindings(mine);
  };

  const onPickSchool = async (id: string) => {
    setSchoolOrgId(id);
    setGradeOrgId("");
    setClassOrgId("");
    setGrades([]);
    setClasses([]);
    setCandidates([]);
    setSelectedStudentUserId("");
    if (!id) return;
    try {
      const gs = await fetchParentGrades(actor, id);
      setGrades(gs);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载年级失败");
    }
  };

  const onPickGrade = async (id: string) => {
    setGradeOrgId(id);
    setClassOrgId("");
    setClasses([]);
    setCandidates([]);
    setSelectedStudentUserId("");
    if (!id) return;
    try {
      const cs = await fetchParentClasses(actor, id);
      setClasses(cs);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "加载班级失败");
    }
  };

  const onVerify = async () => {
    if (!classOrgId) {
      sonnerToast.error("请先选择班级");
      return;
    }
    if (!studentName.trim()) {
      sonnerToast.error("请输入学生姓名");
      return;
    }
    setSubmitting(true);
    try {
      const c = await postVerifyStudent(actor, { classOrgId, studentName: studentName.trim() });
      setCandidates(c);
      setSelectedStudentUserId(c.length === 1 ? c[0]!.studentUserId : "");
      if (c.length === 0) sonnerToast.error("未找到该学生，请核对班级与姓名");
      else if (c.length === 1) sonnerToast.success("校验通过，请提交绑定申请");
      else sonnerToast.message("存在重名，请选择正确的账号");
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "校验失败");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitApply = async () => {
    if (!classOrgId) return sonnerToast.error("请先选择班级");
    if (!selectedStudentUserId) return sonnerToast.error("请先选择学生账号");
    setSubmitting(true);
    try {
      await postBindApply(actor, { classOrgId, studentUserId: selectedStudentUserId });
      sonnerToast.success("申请已提交，请等待学校管理员审核");
      await refreshMine();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold text-foreground">家庭关系</h1>
          <p className="text-sm text-muted-foreground">
            绑定学生账号后，需由学校管理员审核确认；审核通过后家长才能正常进入系统功能。
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void onLogout()}>
          退出登录
        </Button>
      </header>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle>绑定学生账号</CardTitle>
          <CardDescription>按“学校 → 年级 → 班级”点选后，输入学生姓名进行校验并提交申请。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FamilySchoolTreeSelect
              actor={actor}
              value={schoolOrgId}
              onChange={(id) => void onPickSchool(id)}
            />
            <div className="space-y-2">
              <Label>年级</Label>
              <Select value={gradeOrgId} onValueChange={(v) => void onPickGrade(v)} disabled={!schoolOrgId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={!schoolOrgId ? "请先选学校" : "请选择年级"} />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.orgId} value={g.orgId}>
                      {g.orgName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>班级</Label>
              <Select value={classOrgId} onValueChange={setClassOrgId} disabled={!gradeOrgId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={!gradeOrgId ? "请先选年级" : "请选择班级"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.orgId} value={c.orgId}>
                      {c.orgName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>学生姓名</Label>
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="请输入学生姓名（全名）" />
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full" disabled={submitting} onClick={() => void onVerify()}>
                {submitting ? "校验中…" : "校验"}
              </Button>
            </div>
          </div>

          {candidates.length > 0 ? (
            <div className="space-y-2">
              <Label>匹配结果</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {candidates.map((c) => (
                  <Button
                    key={c.studentUserId}
                    type="button"
                    variant={selectedStudentUserId === c.studentUserId ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedStudentUserId(c.studentUserId)}
                  >
                    {c.studentUserName}
                    {c.maskedLoginName ? <span className="ml-2 text-xs text-muted-foreground">（{c.maskedLoginName}）</span> : null}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <Button type="button" disabled={submitting || !selectedStudentUserId} onClick={() => void onSubmitApply()}>
            提交绑定申请
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle>我的申请单</CardTitle>
          <CardDescription>审核状态以学校管理员处理为准；如需重申，可重新提交。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {myBindings.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无申请记录。</p>
          ) : (
            myBindings.map((r) => (
              <div key={r.seqId} className="rounded-lg border border-border bg-muted/10 px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {r.schoolOrgName ?? "—"} / {r.gradeOrgName ?? "—"} / {r.classOrgName ?? "—"} / {r.studentUserName ?? r.studentUserId}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">申请时间：{r.createTime}</p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs">
                    {r.auditStatus === "T" ? "待审核" : r.auditStatus === "Y" ? "已通过" : "已驳回"}
                  </span>
                </div>
                {r.auditStatus === "N" && r.auditComments ? (
                  <p className="mt-2 text-xs text-muted-foreground">驳回说明：{r.auditComments}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
