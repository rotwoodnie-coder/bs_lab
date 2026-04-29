import { NextResponse } from "next/server";

type ImportBody = {
  schema?: string;
  cohort?: string;
  users?: unknown[];
};

export async function POST(request: Request) {
  let body: ImportBody;
  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "empty_body" }, { status: 400 });
  }

  const users = Array.isArray(body.users) ? body.users : [];
  if (users.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_users", message: "请提供 users 数组" },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    accepted: users.length,
    cohort: body.cohort ?? "mixed",
    receivedAt: new Date().toISOString(),
  });
}
