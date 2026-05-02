import { http, HttpResponse } from "msw";

let bindApplied = false;
let selectedPath: Record<string, string | null> = {
  campusId: null,
  levelId: null,
  gradeId: null,
  classId: null,
  studentName: null,
};

const schools = [
  { id: "school_a", name: "第一校区" },
  { id: "school_b", name: "第二校区" },
];

const levelsBySchool: Record<string, { id: string; name: string }[]> = {
  school_a: [
    { id: "level_primary", name: "小学" },
    { id: "level_middle", name: "初中" },
  ],
  school_b: [],
};

const gradesByLevel: Record<string, { id: string; name: string }[]> = {
  level_primary: [
    { id: "grade_1", name: "一年级" },
    { id: "grade_2", name: "二年级" },
  ],
  level_middle: [
    { id: "grade_7", name: "七年级" },
    { id: "grade_8", name: "八年级" },
  ],
};

const gradesBySchool: Record<string, { id: string; name: string }[]> = {
  school_b: [
    { id: "grade_1", name: "一年级" },
    { id: "grade_2", name: "二年级" },
    { id: "grade_3", name: "三年级" },
  ],
};

const classesByGrade: Record<string, { id: string; name: string }[]> = {
  grade_1: [
    { id: "class_1a", name: "1班" },
    { id: "class_1b", name: "2班" },
  ],
  grade_2: [{ id: "class_2a", name: "1班" }],
  grade_3: [{ id: "class_3a", name: "1班" }],
  grade_7: [
    { id: "class_7a", name: "1班" },
    { id: "class_7b", name: "2班" },
  ],
};

export function isBindApplied() {
  return bindApplied;
}

export function getBindPath() {
  return selectedPath;
}

export const bindHandlers = [
  http.get("/api/schools", () => HttpResponse.json({ success: true, data: schools, error: null })),
  http.get("/api/schools/:schoolId/levels", ({ params }) => {
    const schoolId = String(params.schoolId ?? "");
    return HttpResponse.json({ success: true, data: levelsBySchool[schoolId] ?? [], error: null });
  }),
  http.get("/api/schools/:schoolId/grades", ({ params }) => {
    const schoolId = String(params.schoolId ?? "");
    return HttpResponse.json({ success: true, data: gradesBySchool[schoolId] ?? [], error: null });
  }),
  http.get("/api/levels/:levelId/grades", ({ params }) => {
    const levelId = String(params.levelId ?? "");
    return HttpResponse.json({ success: true, data: gradesByLevel[levelId] ?? [], error: null });
  }),
  http.get("/api/grades/:gradeId/classes", ({ params }) => {
    const gradeId = String(params.gradeId ?? "");
    return HttpResponse.json({ success: true, data: classesByGrade[gradeId] ?? [], error: null });
  }),
  http.post("/api/bind/apply", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    selectedPath = {
      campusId: (body.campusId as string | null) ?? null,
      levelId: (body.levelId as string | null) ?? null,
      gradeId: (body.gradeId as string | null) ?? null,
      classId: (body.classId as string | null) ?? null,
      studentName: (body.studentName as string | null) ?? null,
    };
    bindApplied = true;
    console.log("[MSW Handler] 拦截到请求:", request.url);
    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];
