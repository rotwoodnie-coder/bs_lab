import { http, HttpResponse } from "msw";
import { getBindPath, isBindApplied } from "./bind";

function buildToken(hasBinding: boolean, role: string) {
  const payload = btoa(JSON.stringify({ has_binding: hasBinding, role_id: `role_${role}` }));
  return `${payload}.mock-signature`;
}

function readMockRole() {
  if (typeof window === "undefined") return "parent";
  return window.localStorage.getItem("mock-mobile-last-role") ?? "parent";
}

function readMockBinding(role: string) {
  if (role !== "parent") return true;
  if (typeof window === "undefined") return isBindApplied();
  return window.localStorage.getItem("mock-mobile-parent-bound") === "true" || isBindApplied();
}

const schoolsA = [
  { id: "school_a_1", name: "实验小学东校区" },
  { id: "school_a_2", name: "实验小学西校区" },
];
const schoolsB = [{ id: "school_b_1", name: "社区学校" }];

const levelsBySchool: Record<string, Array<{ id: string; name: string }>> = {
  school_a_1: [
    { id: "level_a_primary", name: "小学" },
    { id: "level_a_middle", name: "初中" },
  ],
  school_a_2: [
    { id: "level_a2_primary", name: "小学" },
    { id: "level_a2_middle", name: "初中" },
  ],
  school_b_1: [],
};

const gradesByLevel: Record<string, Array<{ id: string; name: string }>> = {
  level_a_primary: [
    { id: "grade_a_p1", name: "一年级" },
    { id: "grade_a_p2", name: "二年级" },
    { id: "grade_a_p3", name: "三年级" },
    { id: "grade_a_p4", name: "四年级" },
    { id: "grade_a_p5", name: "五年级" },
    { id: "grade_a_p6", name: "六年级" },
  ],
  level_a_middle: [
    { id: "grade_a_m7", name: "七年级" },
    { id: "grade_a_m8", name: "八年级" },
    { id: "grade_a_m9", name: "九年级" },
  ],
  level_a2_primary: [{ id: "grade_a2_p1", name: "一年级" }],
  level_a2_middle: [{ id: "grade_a2_m7", name: "七年级" }],
  school_b_1: [
    { id: "grade_b_p1", name: "一年级" },
    { id: "grade_b_p2", name: "二年级" },
    { id: "grade_b_p3", name: "三年级" },
    { id: "grade_b_p4", name: "四年级" },
    { id: "grade_b_p5", name: "五年级" },
    { id: "grade_b_p6", name: "六年级" },
    { id: "grade_b_m7", name: "七年级" },
    { id: "grade_b_m8", name: "八年级" },
    { id: "grade_b_m9", name: "九年级" },
  ],
};

const classesByGrade: Record<string, Array<{ id: string; name: string }>> = {
  grade_a_p1: [
    { id: "class_a_p1_1", name: "1班" },
    { id: "class_a_p1_2", name: "2班" },
  ],
  grade_a_p2: [{ id: "class_a_p2_1", name: "1班" }],
  grade_a_p3: [{ id: "class_a_p3_1", name: "1班" }],
  grade_a_p4: [{ id: "class_a_p4_1", name: "1班" }],
  grade_a_p5: [{ id: "class_a_p5_1", name: "1班" }],
  grade_a_p6: [{ id: "class_a_p6_1", name: "1班" }],
  grade_a_m7: [{ id: "class_a_m7_1", name: "1班" }],
  grade_a_m8: [{ id: "class_a_m8_1", name: "1班" }],
  grade_a_m9: [{ id: "class_a_m9_1", name: "1班" }],
  grade_b_p1: [{ id: "class_b_p1_1", name: "1班" }],
  grade_b_p2: [{ id: "class_b_p2_1", name: "1班" }],
  grade_b_p3: [{ id: "class_b_p3_1", name: "1班" }],
  grade_b_p4: [{ id: "class_b_p4_1", name: "1班" }],
  grade_b_p5: [{ id: "class_b_p5_1", name: "1班" }],
  grade_b_p6: [{ id: "class_b_p6_1", name: "1班" }],
  grade_b_m7: [{ id: "class_b_m7_1", name: "1班" }],
  grade_b_m8: [{ id: "class_b_m8_1", name: "1班" }],
  grade_b_m9: [{ id: "class_b_m9_1", name: "1班" }],
};

export const authHandlers = [
  http.get("/api/user/context", () => {
    const role = readMockRole();
    const hasBinding = readMockBinding(role);
    return HttpResponse.json({
      success: true,
      data: {
        role,
        has_binding: hasBinding,
        school_level_id: role === "teacher" ? "中学" : "小学",
        nickName: role === "parent" ? "测试家长" : role === "student" ? "测试学生" : "测试老师",
        avatar: "",
      },
      error: null,
    });
  }),
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const role = String(body.role ?? readMockRole());
    const hasBinding = role === "parent" ? readMockBinding(role) : true;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mock-mobile-last-role", role);
      if (role === "parent") window.localStorage.setItem("mock-mobile-parent-bound", String(hasBinding));
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: buildToken(hasBinding, role),
        refreshToken: buildToken(hasBinding, role),
        has_binding: hasBinding,
        school_level_id: role === "teacher" ? "中学" : "小学",
        role,
      },
      error: null,
    });
  }),
  http.post("/api/auth/refresh", async ({ request }) => {
    console.log("[MSW Handler] 拦截到请求:", request.url);
    try {
      const hasBinding = isBindApplied();
      const token = buildToken(hasBinding);
      return HttpResponse.json(
        {
          success: true,
          data: {
            access_token: token,
            refresh_token: "mock-refresh",
            accessToken: token,
            refreshToken: "mock-refresh",
            has_binding: hasBinding,
            school_level_id: "小学",
          },
          error: null,
        },
        { status: 200, headers: { "Set-Cookie": `v2_access_token=${token}; Path=/, v2_refresh_token=mock-refresh; Path=/` } },
      );
    } catch (error) {
      console.error("[MSW Handler] /api/auth/refresh error", error);
      return HttpResponse.json({ success: false }, { status: 500 });
    }
  }),
  http.get("/api/schools", () => HttpResponse.json({ success: true, data: schoolsA.concat(schoolsB), error: null })),
  http.get("/api/schools/:schoolId/levels", ({ params }) => {
    const schoolId = String(params.schoolId ?? "");
    return HttpResponse.json({ success: true, data: levelsBySchool[schoolId] ?? [], error: null });
  }),
  http.get("/api/schools/:schoolId/grades", ({ params }) => {
    const schoolId = String(params.schoolId ?? "");
    return HttpResponse.json({ success: true, data: gradesByLevel[schoolId] ?? gradesByLevel.school_b_1, error: null });
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
    const body = await request.json().catch(() => ({}));
    console.log("[MSW Handler] 拦截到请求:", request.url, body, getBindPath());
    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];
