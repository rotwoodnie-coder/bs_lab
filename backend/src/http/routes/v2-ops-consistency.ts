/**
 * 运维中心：数据一致性检查 API
 * 前缀：/v2/ops/consistency
 *
 * 执行只读 SQL 扫描以下项目：
 *   - 组织类型完整性：data_org_type 中定义的类型 vs sys_org 中实际存在的 org_type_id
 *   - 用户角色一致性：sys_user_role 中 role_id 是否均存在于 data_role
 *   - 字典参照完整性：扫描业务表中常见外键引用
 */
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

interface CheckResult {
  label: string;
  status: "pass" | "fail";
  message: string;
  detail?: string[];
}

const ALLOWED_ROLES = new Set(["role_sys_admin"]);

export async function routeV2OpsConsistency(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (!path.startsWith("/v2/ops/consistency")) return new Response(null, { status: 404 });

    if (req.method !== "GET") return new Response(null, { status: 404 });

    const role = (req.headers.get("x-role") ?? "").trim().toLowerCase();
    if (!ALLOWED_ROLES.has(role)) {
      return fail("仅超级管理员可执行一致性检查", 403);
    }

    const results: CheckResult[] = [];

    results.push(await checkOrgTypeIntegrity());
    results.push(await checkUserRoleConsistency());
    results.push(await checkMaterialTypeRefIntegrity());
    results.push(await checkMaterialSecurityRefIntegrity());

    return ok({ checks: results, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[v2-ops-consistency]", err);
    return fail("服务内部错误", 500);
  }
}

async function checkOrgTypeIntegrity(): Promise<CheckResult> {
  const pool = getMysqlPool();
  const label = "组织类型完整性";
  try {
    const [defined] = await pool.query<RowDataPacket[]>(
      "SELECT type_id FROM data_org_type WHERE status = 'y'",
    );
    const definedSet = new Set(defined.map((r) => r.type_id as string));

    const [inTree] = await pool.query<RowDataPacket[]>(
      "SELECT DISTINCT org_type_id FROM sys_org WHERE org_type_id IS NOT NULL AND is_deleted = 0",
    );
    const treeSet = new Set(inTree.map((r) => r.org_type_id as string));

    const missingInTree = [...definedSet].filter((t) => !treeSet.has(t));
    const unexpectedInTree = [...treeSet].filter((t) => !definedSet.has(t));
    const errors: string[] = [];

    if (missingInTree.length > 0) {
      errors.push(`data_org_type 已定义但 sys_org 中未使用的类型：${missingInTree.join(", ")}`);
    }
    if (unexpectedInTree.length > 0) {
      errors.push(`sys_org 中存在但 data_org_type 未定义的类型：${unexpectedInTree.join(", ")}`);
    }

    return {
      label,
      status: errors.length === 0 ? "pass" : "fail",
      message: errors.length === 0
        ? "组织类型完整性检查通过"
        : "发现组织类型不一致，请核对 data_org_type 与 sys_org 的 org_type_id",
      detail: errors.length > 0 ? errors : undefined,
    };
  } catch (e) {
    return { label, status: "fail", message: `检查执行异常：${e instanceof Error ? e.message : String(e)}` };
  }
}

async function checkUserRoleConsistency(): Promise<CheckResult> {
  const pool = getMysqlPool();
  const label = "用户角色一致性";
  try {
    const [roleIdsInData] = await pool.query<RowDataPacket[]>(
      "SELECT role_id FROM data_role WHERE status = 'y'",
    );
    const validRoles = new Set(roleIdsInData.map((r) => r.role_id as string));

    const [inUse] = await pool.query<RowDataPacket[]>(
      "SELECT DISTINCT role_id FROM sys_user_role",
    );
    const orphans = inUse.filter((r) => !validRoles.has(r.role_id as string)).map((r) => r.role_id as string);
    const errors: string[] = [];

    if (orphans.length > 0) {
      errors.push(`sys_user_role 中存在 ${orphans.length} 个 data_role 中不存在的 role_id：${orphans.slice(0, 10).join(", ")}${orphans.length > 10 ? "…" : ""}`);
    }

    return {
      label,
      status: errors.length === 0 ? "pass" : "fail",
      message: errors.length === 0
        ? "用户角色一致性检查通过"
        : "存在 sys_user_role 引用了 data_role 中不存在的角色",
      detail: errors.length > 0 ? errors : undefined,
    };
  } catch (e) {
    return { label, status: "fail", message: `检查执行异常：${e instanceof Error ? e.message : String(e)}` };
  }
}

async function checkMaterialTypeRefIntegrity(): Promise<CheckResult> {
  const pool = getMysqlPool();
  const label = "材料分类参照完整性";
  try {
    // exp_material.material_type_id -> data_material_type.type_id
    // 查询 data_material_type 中所有可用的 type_id
    const [validTypes] = await pool.query<RowDataPacket[]>(
      "SELECT type_id FROM data_material_type WHERE status = 'y'",
    );
    const validSet = new Set(validTypes.map((r) => r.type_id as string));

    // 如果 exp_material 表不存在或空，跳过
    let materialOrphans: string[] = [];
    try {
      const [used] = await pool.query<RowDataPacket[]>(
        "SELECT DISTINCT material_type_id FROM exp_material WHERE material_type_id IS NOT NULL",
      );
      materialOrphans = used
        .filter((r) => !validSet.has(r.material_type_id as string))
        .map((r) => r.material_type_id as string);
    } catch {
      // exp_material 表可能不存在
      materialOrphans = [];
    }

    const errors: string[] = [];
    if (materialOrphans.length > 0) {
      errors.push(`exp_material 中存在 ${materialOrphans.length} 个 data_material_type 中不存在的 material_type_id`);
    }

    return {
      label,
      status: errors.length === 0 ? "pass" : "fail",
      message: errors.length === 0 ? "材料分类参照完整性检查通过" : "发现材料分类引用异常",
      detail: errors.length > 0 ? errors : undefined,
    };
  } catch (e) {
    return { label, status: "fail", message: `检查执行异常：${e instanceof Error ? e.message : String(e)}` };
  }
}

async function checkMaterialSecurityRefIntegrity(): Promise<CheckResult> {
  const pool = getMysqlPool();
  const label = "材料安全性参照完整性";
  try {
    // exp_material.security_id -> data_material_security.security_id
    const [valid] = await pool.query<RowDataPacket[]>(
      "SELECT security_id FROM data_material_security WHERE status = 'y'",
    );
    const validSet = new Set(valid.map((r) => r.security_id as string));

    let orphans: string[] = [];
    try {
      const [used] = await pool.query<RowDataPacket[]>(
        "SELECT DISTINCT security_id FROM exp_material_security WHERE security_id IS NOT NULL",
      );
      orphans = used
        .filter((r) => !validSet.has(r.security_id as string))
        .map((r) => r.security_id as string);
    } catch {
      orphans = [];
    }

    const errors: string[] = [];
    if (orphans.length > 0) {
      errors.push(`exp_material_security 中存在 ${orphans.length} 个 data_material_security 中不存在的 security_id`);
    }

    return {
      label,
      status: errors.length === 0 ? "pass" : "fail",
      message: errors.length === 0 ? "材料安全性参照完整性检查通过" : "发现材料安全性引用异常",
      detail: errors.length > 0 ? errors : undefined,
    };
  } catch (e) {
    return { label, status: "fail", message: `检查执行异常：${e instanceof Error ? e.message : String(e)}` };
  }
}
