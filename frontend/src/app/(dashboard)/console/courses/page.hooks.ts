"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { callNewCoreApi, getExperimentCatalogTenantId } from "@/lib/new-core-api";
import type { ApiActor } from "@/lib/new-core-api";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchCoursebooksEnriched,
  createEduTextbookApi,
  updateEduTextbookApi,
  deleteEduTextbookApi,
  type CoursebookEnriched,
} from "@/lib/edu-textbooks-api";

export type CourseForm = {
  coursebookName: string;
  coursebookVersion: string;
  subjectId: string;
  comments: string;
  status: "y" | "n";
  targetClassIds: string[];
  deadline: string;
};

const EMPTY_FORM: CourseForm = {
  coursebookName: "", coursebookVersion: "", subjectId: "", comments: "",
  status: "y", targetClassIds: [], deadline: "",
};

const expApiHeaders = (): Record<string, string> => ({
  "x-tenant-id": getExperimentCatalogTenantId(),
  "x-app-id": "console",
});

export function useCoursesPage() {
  const { role, orgId } = useSessionActor();
  const { user } = useAuth();
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "edu-textbooks"), [role, orgId]);

  /** Actor with real userId — required for teacher-class validation on homework endpoint */
  const authActor = React.useMemo<ApiActor>(() => ({
    role: user.role,
    orgId: user.orgId || orgId,
    userId: user.userId,
    userName: user.userName,
  }), [user, orgId]);

  const [items, setItems] = React.useState<CoursebookEnriched[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [keyword, setKeyword] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [stepperOpen, setStepperOpen] = React.useState(false);
  const [stepperStep, setStepperStep] = React.useState(1);
  const [stepperForm, setStepperForm] = React.useState<CourseForm>(EMPTY_FORM);
  const [newCourseId, setNewCourseId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<CoursebookEnriched | null>(null);
  const [editForm, setEditForm] = React.useState<CourseForm>(EMPTY_FORM);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = React.useCallback(async (kw?: string) => {
    setLoading(true);
    try { setItems(await fetchCoursebooksEnriched(actor, kw)); }
    catch { showToast("err", "加载课程列表失败"); }
    finally { setLoading(false); }
  }, [actor]);

  React.useEffect(() => { void load(keyword); }, [load, keyword]);

  const openCreate = () => { setStepperForm(EMPTY_FORM); setNewCourseId(null); setStepperStep(1); setStepperOpen(true); };

  const stepperNext = async () => {
    if (stepperStep === 1) {
      if (!stepperForm.coursebookName.trim()) return;
      setSubmitting(true);
      try {
        const res = await createEduTextbookApi(actor, { coursebookName: stepperForm.coursebookName.trim(), coursebookVersion: stepperForm.coursebookVersion || undefined, comments: stepperForm.comments || undefined, status: "n" });
        setNewCourseId(res.newId);
        setStepperStep(2);
        await load(keyword);
      } catch { showToast("err", "创建课程失败，请重试"); }
      finally { setSubmitting(false); }
    } else if (stepperStep === 2) {
      setStepperStep(3);
    } else if (stepperStep === 3) {
      if (!newCourseId) return;
      setSubmitting(true);
      try {
        await updateEduTextbookApi(actor, newCourseId, { status: stepperForm.status });
        // Distribute experiments to selected classes when publishing
        if (stepperForm.status === "y" && stepperForm.targetClassIds.length > 0) {
          for (const classId of stepperForm.targetClassIds) {
            await callNewCoreApi(authActor, "/v2/exp/publish-coursebook-tasks", "POST",
              { coursebookId: newCourseId, targetClassId: classId, requireDate: stepperForm.deadline || null } as Record<string, unknown>,
              expApiHeaders());
          }
        }
        const classCount = stepperForm.targetClassIds.length;
        showToast("ok", classCount > 0 ? `课程已发布，已分发至 ${classCount} 个班级` : "课程已创建");
        setStepperOpen(false);
        await load(keyword);
      } catch (e) {
        showToast("err", e instanceof Error ? e.message : "操作失败，请重试");
      }
      finally { setSubmitting(false); }
    }
  };

  const openEdit = (item: CoursebookEnriched) => {
    setEditTarget(item);
    setEditForm({ coursebookName: item.coursebookName, coursebookVersion: item.coursebookVersion ?? "", subjectId: item.subjectId ?? "", comments: item.comments ?? "", status: (item.status as "y" | "n") ?? "y", targetClassIds: [], deadline: "" });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editTarget || !editForm.coursebookName.trim()) return;
    setBusyId(editTarget.coursebookId);
    try {
      await updateEduTextbookApi(actor, editTarget.coursebookId, { coursebookName: editForm.coursebookName.trim(), coursebookVersion: editForm.coursebookVersion || null, comments: editForm.comments || null, status: editForm.status });
      showToast("ok", "课程信息已更新");
      setEditOpen(false);
      await load(keyword);
    } catch { showToast("err", "更新失败"); }
    finally { setBusyId(null); }
  };

  const removeCourse = async (id: string, name: string) => {
    if (!globalThis.confirm(`确认停用课程「${name}」？`)) return;
    setBusyId(id);
    try {
      await deleteEduTextbookApi(actor, id);
      showToast("ok", "课程已停用");
      await load(keyword);
    } catch { showToast("err", "操作失败"); }
    finally { setBusyId(null); }
  };

  return {
    actor, items, loading, keyword, setKeyword, busyId, toast,
    stepperOpen, setStepperOpen, stepperStep, setStepperStep, stepperForm, setStepperForm, newCourseId, submitting,
    editOpen, setEditOpen, editForm, setEditForm, editTarget,
    openCreate, stepperNext, openEdit, submitEdit, removeCourse, load,
  };
}
