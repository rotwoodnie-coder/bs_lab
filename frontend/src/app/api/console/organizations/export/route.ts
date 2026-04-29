import { NextResponse } from "next/server";

import { buildExportDocument } from "@/lib/console-org-tree";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") ?? "subtree") as "full" | "subtree";
  const nodeId = searchParams.get("nodeId") ?? undefined;

  if (mode === "full") {
    const doc = buildExportDocument({ mode: "full" });
    return new NextResponse(JSON.stringify(doc, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="organizations-full.json"',
      },
    });
  }

  if (!nodeId) {
    return NextResponse.json({ ok: false, error: "nodeId_required" }, { status: 400 });
  }

  const doc = buildExportDocument({ mode: "subtree", nodeId });
  if (!doc) {
    return NextResponse.json({ ok: false, error: "node_not_found" }, { status: 404 });
  }

  const anchorId = "anchorNodeId" in doc ? doc.anchorNodeId : "node";
  const safeName = (anchorId ?? "node").replace(/[^\w.-]+/g, "_");
  return new NextResponse(JSON.stringify(doc, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="organizations-subtree-${safeName}.json"`,
    },
  });
}
