"use client";

import * as React from "react";
import { Badge, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Textarea } from "@bs-lab/ui";
import { cn } from "@/lib/utils";
import type { ApiActor } from "@/lib/new-core-api";
import { useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { getTeacherAuthorizedClasses, type TeacherAuthorizedClassRow } from "@/lib/v2/v2-sys-org-api";
import type { CourseForm } from "../page.hooks";
import type { CoursebookEnriched } from "@/lib/edu-textbooks-api";
import { CourseStep2Tree } from "./course-step2-tree";

type SubjectItem = { id: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  step: number;
  form: CourseForm;
  setForm: React.Dispatch<React.SetStateAction<CourseForm>>;
  submitting: boolean;
  onNext: () => void;
  onBack: () => void;
  newCourseId: string | null;
  subjects: SubjectItem[];
  actor: ApiActor;
  existingItem?: CoursebookEnriched | null;
};

const STEPS = ["基础信息", "内容编排", "发布设置"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2", done ? "bg-foreground text-background ring-foreground" : active ? "bg-foreground text-background ring-foreground" : "bg-muted text-muted-foreground ring-border")}>
                {done ? "✓" : idx}
              </div>
              <span className={cn("text-xs", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn("mx-1 mb-5 h-px flex-1", done ? "bg-foreground" : "bg-border")} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Step1({ form, setForm, subjects }: { form: CourseForm; setForm: Props["setForm"]; subjects: SubjectItem[] }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <Label>课程名称 <span className="text-destructive">*</span></Label>
        <Input value={form.coursebookName} onChange={(e) => setForm((d) => ({ ...d, coursebookName: e.target.value }))} placeholder="请输入课程名称" />
      </div>
      <div className="grid gap-1">
        <Label>学科</Label>
        <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.subjectId} onChange={(e) => setForm((d) => ({ ...d, subjectId: e.target.value }))}>
          <option value="">— 请选择学科 —</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid gap-1">
        <Label>版本号</Label>
        <Input value={form.coursebookVersion} onChange={(e) => setForm((d) => ({ ...d, coursebookVersion: e.target.value }))} placeholder="如：2024版" />
      </div>
      <div className="grid gap-1">
        <Label>课程说明</Label>
        <Textarea value={form.comments} onChange={(e) => setForm((d) => ({ ...d, comments: e.target.value }))} placeholder="选填，简要描述课程内容与目标（最多 100 字）" rows={3} maxLength={100} className="resize-none text-sm" />
        <p className="text-xs text-muted-foreground text-right">{form.comments.length}/100</p>
      </div>
    </div>
  );
}

function Step2({ newCourseId, courseName, actor }: { newCourseId: string | null; courseName: string; actor: ApiActor }) {
  return (
    <div className="space-y-3">
      {newCourseId && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Badge variant="secondary" className="border-emerald-200 bg-emerald-100 text-emerald-700 shrink-0">已创建</Badge>
          <span className="text-sm font-medium text-emerald-700 truncate">「{courseName}」</span>
        </div>
      )}
      <p className="text-xs text-muted-foreground">点击章节查看小节与已关联实验。章节内容可在「章节管理」页面维护。</p>
      <CourseStep2Tree actor={actor} coursebookId={newCourseId} />
    </div>
  );
}

function ClassSelector({ form, setForm }: { form: CourseForm; setForm: Props["setForm"] }) {
  const { user } = useAuth();
  const [classes, setClasses] = React.useState<TeacherAuthorizedClassRow[]>([]);
  const [classLoading, setClassLoading] = React.useState(true);

  React.useEffect(() => {
    const coreActor: CoreApiActor = { role: user.role, orgId: user.orgId, userId: user.userId, userName: user.userName, tenantId: user.tenantId, appId: user.appId };
    setClassLoading(true);
    void getTeacherAuthorizedClasses(coreActor, form.subjectId || undefined)
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setClassLoading(false));
  }, [user, form.subjectId]);

  const toggle = (id: string) => {
    setForm((d) => {
      const ids = d.targetClassIds.includes(id) ? d.targetClassIds.filter((x) => x !== id) : [...d.targetClassIds, id];
      return { ...d, targetClassIds: ids };
    });
  };

  if (classLoading) return <p className="text-xs text-muted-foreground">加载授课班级中…</p>;
  if (classes.length === 0) return <p className="text-xs text-muted-foreground">暂无授课班级，跳过分发仍可创建。</p>;

  return (
    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-0.5">
      {classes.map((c) => {
        const checked = form.targetClassIds.includes(c.orgId);
        return (
          <button key={c.orgId} type="button" onClick={() => toggle(c.orgId)}
            className={cn("rounded-md border px-3 py-2 text-left text-xs transition-colors", checked ? "border-foreground bg-foreground/5 font-medium" : "border-border hover:border-foreground/40 text-muted-foreground")}>
            {c.fullPathName?.trim() ? c.fullPathName : c.orgName}
          </button>
        );
      })}
    </div>
  );
}

function Step3({ form, setForm }: { form: CourseForm; setForm: Props["setForm"] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-1">
        <Label className="text-sm">发布状态</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["y", "n"] as const).map((val) => (
            <button key={val} type="button" onClick={() => setForm((d) => ({ ...d, status: val }))}
              className={cn("rounded-md border-2 p-3 text-left transition-colors", form.status === val ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40")}>
              <div className="font-semibold text-sm">{val === "y" ? "立即发布" : "草稿"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{val === "y" ? "发布后班级可见" : "暂不公开"}</div>
            </button>
          ))}
        </div>
      </div>
      {form.status === "y" && (
        <>
          <div className="grid gap-1">
            <Label className="text-sm">目标班级 <span className="text-xs font-normal text-muted-foreground">（选填，发布后同步分发课程实验）</span></Label>
            <ClassSelector form={form} setForm={setForm} />
          </div>
          <div className="grid gap-1">
            <Label className="text-sm">截止日期</Label>
            <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm((d) => ({ ...d, deadline: e.target.value }))} className="h-9 text-sm" />
          </div>
        </>
      )}
      <div className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
        课程状态与班级分发随时可在列表页调整。
      </div>
    </div>
  );
}

export function CourseCreateStepper({ open, onOpenChange, step, form, setForm, submitting, onNext, onBack, newCourseId, subjects, actor }: Props) {
  const isLastStep = step === 3;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(step === 2 ? "sm:max-w-xl" : "sm:max-w-lg")}>
        <DialogHeader><DialogTitle>新建实验课程</DialogTitle></DialogHeader>
        <StepIndicator current={step} />
        {step === 1 && <Step1 form={form} setForm={setForm} subjects={subjects} />}
        {step === 2 && <Step2 newCourseId={newCourseId} courseName={form.coursebookName} actor={actor} />}
        {step === 3 && <Step3 form={form} setForm={setForm} />}
        <DialogFooter className="mt-4 flex items-center justify-between gap-2">
          <div>{step > 1 && <Button type="button" variant="outline" size="sm" onClick={onBack} disabled={submitting}>上一步</Button>}</div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>取消</Button>
            <Button type="button" size="sm" onClick={onNext} disabled={submitting || (step === 1 && !form.coursebookName.trim())}>
              {submitting ? "处理中…" : isLastStep ? "完成创建" : "下一步"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
