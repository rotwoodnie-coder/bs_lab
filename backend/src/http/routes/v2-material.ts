import { z } from "zod";
import { getMaterialList, getMaterialDetail, saveMaterial, MaterialServiceError } from "../../services/MaterialService.ts";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, message: "ok", error: null });
}
function fail(code: number, msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, message: null, error: { code, message: msg } }, { status });
}

const materialQuerySchema = z.object({
  keyword: z.string().optional(),
  materialTypeId: z.string().optional(),
  materialPropId: z.string().optional(),
  status: z.string().optional(),
  createUserId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const saveMaterialSchema = z.object({
  materialId: z.string().min(1).max(32).optional(),
  materialName: z.string().min(1),
  materialPropId: z.union([z.string(), z.null()]).optional(),
  materialTypeId: z.union([z.string(), z.null()]).optional(),
  materialNum: z.union([z.string(), z.null()]).optional(),
  mainPicUrl: z.union([z.string(), z.null()]).optional(),
  expPurpose: z.union([z.string(), z.null()]).optional(),
  additionalComments: z.union([z.string(), z.null()]).optional(),
  comments: z.union([z.string(), z.null()]).optional(),
  status: z.union([z.string(), z.null()]).optional(),
  ownerUserId: z.union([z.string(), z.null()]).optional(),
});

export async function routeV2Material(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? undefined;

    if (req.method === "GET" && path === "/v2/material") {
      const query = materialQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
      return ok(await getMaterialList(query));
    }

    if (req.method === "POST" && path === "/v2/material") {
      const input = saveMaterialSchema.parse(await req.json());
      return ok(await saveMaterial(input, actorId));
    }

    const matMatch = path.match(/^\/v2\/material\/([^/]+)$/);
    if (matMatch && req.method === "GET") {
      const record = await getMaterialDetail(getMysqlPool(), decodeURIComponent(matMatch[1]!));
      if (!record) return fail(4040, "未找到该材料", 404);
      return ok(record);
    }

    if (matMatch && (req.method === "PUT" || req.method === "PATCH")) {
      const input = saveMaterialSchema.parse(await req.json());
      return ok(await saveMaterial({ ...input, materialId: decodeURIComponent(matMatch[1]!) }, actorId));
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(4000, `参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    if (err instanceof MaterialServiceError) {
      if (err.code === "MATERIAL_NAME_EMPTY") return fail(4002, "物料名称不能为空", 400);
      if (err.code === "CONTENT_TOO_LONG") return fail(4001, "物料内容过长", 400);
      if (err.code === "NOT_FOUND") return fail(4040, "未找到该材料", 404);
      return fail(5000, err.message, 500);
    }
    if (err instanceof Error) return fail(5000, err.message, 500);
    return fail(5000, "服务内部错误", 500);
  }
}
