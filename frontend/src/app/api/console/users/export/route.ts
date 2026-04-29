import { NextResponse } from "next/server";

export type UserCohort = "student" | "researcher" | "school_admin" | "all";

const MOCK_ROWS: Record<Exclude<UserCohort, "all">, { id: string; name: string; org: string }[]> = {
  student: [
    { id: "stu-1001", name: "张同学", org: "宝山一中 · 十一年级(3)班" },
    { id: "stu-1002", name: "李同学", org: "宝山一中 · 十一年级(4)班" },
  ],
  researcher: [{ id: "res-501", name: "王老师", org: "区教育学院 · 物理教研" }],
  school_admin: [{ id: "sch-901", name: "赵管理员", org: "宝山一中" }],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cohort = (searchParams.get("cohort") ?? "all") as UserCohort;
  const exportedAt = new Date().toISOString();

  let users: { id: string; name: string; org: string; cohort: string }[] = [];
  if (cohort === "all") {
    users = [
      ...MOCK_ROWS.student.map((u) => ({ ...u, cohort: "student" })),
      ...MOCK_ROWS.researcher.map((u) => ({ ...u, cohort: "researcher" })),
      ...MOCK_ROWS.school_admin.map((u) => ({ ...u, cohort: "school_admin" })),
    ];
  } else if (cohort in MOCK_ROWS) {
    users = MOCK_ROWS[cohort as Exclude<UserCohort, "all">].map((u) => ({
      ...u,
      cohort,
    }));
  }

  const payload = {
    schema: "bs-lab.console.users.export.v1",
    cohort,
    exportedAt,
    users,
  };

  const filename = cohort === "all" ? "users-all.json" : `users-${cohort}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
