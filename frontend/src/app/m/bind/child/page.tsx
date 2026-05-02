"use client";

import { useMemo, useState } from "react";

type SelectOption = { id: string; name: string };
type BindStatus = "idle" | "pending" | "approved" | "rejected";

type BindResult = {
  status: BindStatus;
  message: string;
  rejectReason?: string;
};

const SCHOOLS: SelectOption[] = [
  { id: "school_1", name: "第一校区" },
  { id: "school_2", name: "第二校区" },
];

const LEVELS: Record<string, SelectOption[]> = {
  school_1: [{ id: "level_1", name: "小学" }],
  school_2: [],
};

const GRADES: Record<string, SelectOption[]> = {
  level_1: [
    { id: "grade_1", name: "一年级" },
    { id: "grade_2", name: "二年级" },
  ],
  school_2: [
    { id: "grade_7", name: "七年级" },
    { id: "grade_8", name: "八年级" },
  ],
};

const CLASSES: Record<string, SelectOption[]> = {
  grade_1: [
    { id: "class_1", name: "1班" },
    { id: "class_2", name: "2班" },
  ],
  grade_7: [{ id: "class_7_1", name: "7年级1班" }],
};

function submitBindApplication(payload: {
  schoolId: string;
  levelId: string | null;
  gradeId: string;
  classId: string;
  studentName: string;
}): Promise<BindResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (payload.studentName.includes("拒绝")) {
        resolve({ status: "rejected", message: "绑定申请未通过", rejectReason: "学生信息与班级名单不匹配，请确认后重新提交。" });
        return;
      }

      resolve({ status: "pending", message: "绑定申请已提交，等待老师审核" });
    }, 500);
  });
}

function getNextStep(currentStep: number, selectedSchoolId: string | null) {
  if (currentStep === 0) {
    const levels = selectedSchoolId ? LEVELS[selectedSchoolId] ?? [] : [];
    return levels.length === 0 ? 2 : 1;
  }
  if (currentStep === 1) return 2;
  if (currentStep === 2) return 3;
  return 4;
}

export default function BindChildPage() {
  const [step, setStep] = useState(0);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [result, setResult] = useState<BindResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = ["校区", "学段", "年级", "班级", "学生姓名"];

  const options = useMemo(() => {
    switch (step) {
      case 0:
        return SCHOOLS;
      case 1:
        return schoolId ? LEVELS[schoolId] ?? [] : [];
      case 2:
        if (levelId) return GRADES[levelId] ?? [];
        if (schoolId) return GRADES[schoolId] ?? [];
        return [];
      case 3:
        return gradeId ? CLASSES[gradeId] ?? [] : [];
      default:
        return [];
    }
  }, [gradeId, levelId, schoolId, step]);

  const handleSelect = (id: string) => {
    if (step === 0) {
      setSchoolId(id);
      setLevelId(null);
      setGradeId(null);
      setClassId(null);
      setResult(null);
      setStep(getNextStep(0, id));
      return;
    }
    if (step === 1) setLevelId(id);
    if (step === 2) setGradeId(id);
    if (step === 3) setClassId(id);
    setResult(null);
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    if (!schoolId || !gradeId || !classId || !studentName.trim()) {
      setResult({ status: "rejected", message: "绑定申请未通过", rejectReason: "请完整选择校区、年级、班级并填写学生姓名。" });
      return;
    }

    setIsSubmitting(true);
    const nextResult = await submitBindApplication({
      schoolId,
      levelId,
      gradeId,
      classId,
      studentName: studentName.trim(),
    });
    setResult(nextResult);
    setIsSubmitting(false);
  };

  const handleSimulateApproved = () => {
    document.cookie = `v2_access_token=${btoa(JSON.stringify({ role_id: "role_parent", has_binding: true }))}.mock-signature; path=/; max-age=3600`;
    document.cookie = "bs_has_binding=1; path=/; max-age=3600";
    setResult({ status: "approved", message: "绑定成功" });
  };

  const canResubmit = !isSubmitting && result?.status !== "pending";

  return (
    <div style={{ padding: "20px", maxWidth: "420px", margin: "0 auto" }}>
      <h2>绑定孩子</h2>
      <p>步骤 {Math.min(step + 1, steps.length)} / {steps.length}：选择{steps[Math.min(step, steps.length - 1)]}</p>

      {result?.status === "pending" ? (
        <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "10px", background: "#fff3cd", color: "#7a5b00" }}>
          绑定申请已提交，等待老师审核
        </div>
      ) : null}

      {result?.status === "approved" ? (
        <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "10px", background: "#d1e7dd", color: "#0f5132" }}>
          绑定成功
        </div>
      ) : null}

      {result?.status === "rejected" ? (
        <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "10px", background: "#f8d7da", color: "#842029" }}>
          <div>{result.message}</div>
          {result.rejectReason ? <div style={{ marginTop: "6px" }}>{result.rejectReason}</div> : null}
        </div>
      ) : null}

      {step < 4 ? (
        <div>
          {options.length === 0 ? (
            <p>无可用选项，自动跳过</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {options.map((opt) => (
                <li
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  style={{
                    padding: "12px",
                    margin: "8px 0",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {opt.name}
                </li>
              ))}
            </ul>
          )}
          {options.length === 0 && (
            <button onClick={() => setStep((prev) => prev + 1)}>跳过</button>
          )}
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="请输入学生姓名"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />
          <button
            onClick={handleSubmit}
            disabled={!canResubmit}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: canResubmit ? "#007bff" : "#9bb8da",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: canResubmit ? "pointer" : "not-allowed",
            }}
          >
            {isSubmitting ? "提交中..." : "提交绑定"}
          </button>
          <button
            onClick={handleSimulateApproved}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              backgroundColor: "#198754",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            手动模拟审核通过
          </button>
          {result?.status === "approved" ? (
            <button
              onClick={() => window.location.href = "/m"}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "10px",
                backgroundColor: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              进入首页
            </button>
          ) : null}
        </div>
      )}

      {step > 0 && (
        <button
          onClick={() => setStep((prev) => prev - 1)}
          style={{ marginTop: "15px", padding: "8px" }}
        >
          上一步
        </button>
      )}
    </div>
  );
}
