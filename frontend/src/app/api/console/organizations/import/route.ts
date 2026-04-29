import { NextResponse } from "next/server";

import {
  ORG_EXPORT_SCHEMA,
  ORG_IMPORT_SCHEMA,
  countTreeNodes,
  type OrgTreeNode,
} from "@/lib/console-org-tree";

type ImportBody = {
  schema?: string;
  tree?: OrgTreeNode;
  roots?: OrgTreeNode[];
};

function isOrgNode(x: unknown): x is OrgTreeNode {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.kind === "string";
}

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

  const schemaOk =
    !body.schema || body.schema === ORG_IMPORT_SCHEMA || body.schema === ORG_EXPORT_SCHEMA;
  if (!schemaOk) {
    return NextResponse.json(
      {
        ok: false,
        error: "schema_mismatch",
        message: `期望 schema 为 ${ORG_IMPORT_SCHEMA} 或 ${ORG_EXPORT_SCHEMA}`,
      },
      { status: 422 },
    );
  }

  let accepted = 0;
  if (body.tree && isOrgNode(body.tree)) {
    accepted = countTreeNodes(body.tree);
  } else if (Array.isArray(body.roots) && body.roots.length > 0) {
    const valid = body.roots.filter(isOrgNode);
    if (valid.length === 0) {
      return NextResponse.json(
        { ok: false, error: "no_valid_roots", message: "roots 中无有效组织节点" },
        { status: 422 },
      );
    }
    accepted = valid.reduce((s, r) => s + countTreeNodes(r), 0);
  } else {
    return NextResponse.json(
      { ok: false, error: "no_tree", message: "请提供 tree 或 roots 数组" },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    accepted,
    receivedAt: new Date().toISOString(),
  });
}
