import { http, HttpResponse } from "msw";
import { isBindApplied } from "./bind";

const bindings = [
  {
    seqId: "bind_001",
    parentUserId: "parent_001",
    studentUserId: "student_001",
    schoolOrgId: "school_001",
    createTime: "2026-05-02 09:00:00",
    auditStatus: "Y",
    auditUserId: "teacher_001",
    auditComments: "auto approved",
    auditTime: "2026-05-02 09:05:00",
    studentUserName: "小明",
    classOrgId: "class_101",
    classOrgName: "三年级一班",
    gradeOrgId: "grade_03",
    gradeOrgName: "三年级",
    schoolOrgIdResolved: "school_001",
    schoolOrgName: "实验小学",
  },
];

export const bindingsHandlers = [
  http.get("/api/bindings", () => {
    const hasBinding = isBindApplied();
    return HttpResponse.json({
      success: true,
      data: { items: hasBinding ? bindings.filter((item) => item.auditStatus === "Y") : [] },
      error: null,
    });
  }),
];
