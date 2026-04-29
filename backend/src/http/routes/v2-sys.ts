/**
 * V2 系统主数据 HTTP 路由
 * 前缀：/v2/sys-user  /v2/sys-org  /v2/sys-msg
 */
import { z } from "zod";
import {
  listSysUsers,
  getSysUserById,
  createSysUser,
  updateSysUser,
  deleteSysUser,
  listSysOrgs,
  getSysOrgById,
  createSysOrg,
} from "../../infrastructure/repositories/v2-sys-user-repository.ts";
import { deleteSysOrgHard, updateSysOrg } from "../../infrastructure/repositories/v2-sys-org-repository.ts";
import { fetchSchoolGradeIdsByOrgIds } from "../../infrastructure/repositories/v2-sys-org-school-grade-repository.ts";
import { querySysOrgTreeRowsForActor, fetchStudentCountsByOrgIds } from "../../infrastructure/repositories/v2-sys-org-tree-scope.ts";
import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../../infrastructure/ids/identifiable-varchar32.ts";
import { assertSysOrgCreateScope } from "./v2-sys-org-create-scope.ts";
import { assertAnyPermission, assertPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

// ─── Schema ──────────────────────────────────────────────
const userQuerySchema = z.object({
  keyword: z.string().optional(),
  userOrgId: z.string().optional(),
  userRoleId: z.string().optional(),
  status: z.enum(["y", "n"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);

const createUserSchema = z.object({
  userId: id32Token.optional(),
  userName: z.string().min(1),
  loginName: z.string().min(1),
  loginPwd: z.string().min(6),
  userOrgId: z.string().optional(),
  userRoleId: z.string().optional(),
  userNickName: z.string().optional(),
  userPhone: z.string().optional(),
  userEmail: z.string().optional(),
  expireDate: z.string().optional(),
  prefTitleId: z.string().optional(),
  status: z.enum(["y", "n"]).optional(),
  comments: z.string().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ loginPwd: true }).extend({
  loginPwd: z.string().min(6).optional(),
});

const orgQuerySchema = z.object({
  keyword: z.string().optional(),
  orgTypeId: z.string().optional(),
  parentOrgId: z.string().optional(),
  status: z.enum(["y", "n"]).optional(),
});

const createOrgSchema = z.object({
  orgId: id32Token.optional(),
  orgName: z.string().min(1),
  orgTypeId: z.string().optional(),
  gradeId: z.string().optional(),
  /** 学校类组织开设年级（多选），写入 `sys_org_school_grade` */
  school_grade_ids: z.array(id32Token).optional(),
  parentOrgId: z.string().optional(),
  orgPath: z.string().optional(),
  status: z.enum(["y", "n"]).optional(),
  sortOrder: z.number().optional(),
});

const patchOrgSchema = z.object({
  orgName: z.string().min(1).max(60).optional(),
  orgTypeId: z.string().min(1).nullable().optional(),
  gradeId: z.string().min(1).nullable().optional(),
  parentOrgId: z.string().min(1).nullable().optional(),
  /** 出现则整包替换 `sys_org_school_grade`（空数组清空） */
  school_grade_ids: z.array(id32Token).optional(),
  status: z.enum(["y", "n"]).optional(),
  sortOrder: z.number().int().optional(),
});

const sendMsgSchema = z.object({
  receiverUserId: z.string().min(1),
  msgTypeId: z.string().optional(),
  bizType: z.string().optional(),
  msgContent: z.string().min(1),
});

// ─── 主路由 ───────────────────────────────────────────────
export async function routeV2Sys(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? undefined;
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;
    const pool = getMysqlPool();

    // ── sys-user ──────────────────────────────────────────
    if (path === "/v2/sys-user") {
      if (req.method === "GET") {
        assertAnyPermission(actorRoleId, [PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ORG_MANAGE]);
        const query = userQuerySchema.parse(Object.fromEntries(url.searchParams));
        return ok(await listSysUsers(query));
      }
      if (req.method === "POST") {
        assertPermission(actorRoleId, PERMISSIONS.USER_MANAGE);
        const input = createUserSchema.parse(await req.json());
        return ok(await createSysUser(input, actorId));
      }
    }

    const userMatch = path.match(/^\/v2\/sys-user\/([^/]+)$/);
    if (userMatch) {
      const userId = decodeURIComponent(userMatch[1]!);
      if (req.method === "GET") {
        assertAnyPermission(actorRoleId, [PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ORG_MANAGE]);
        const row = await getSysUserById(userId);
        if (!row) return fail("用户不存在", 404);
        return ok(row);
      }
      if (req.method === "PATCH" || req.method === "PUT") {
        assertPermission(actorRoleId, PERMISSIONS.USER_MANAGE);
        const input = updateUserSchema.parse(await req.json());
        return ok(await updateSysUser(userId, input, actorId));
      }
      if (req.method === "DELETE") {
        assertPermission(actorRoleId, PERMISSIONS.USER_MANAGE);
        await deleteSysUser(userId, actorId);
        return ok({ deleted: true });
      }
    }

    // 批量修改用户状态
    if (path === "/v2/sys-user/batch-status" && req.method === "POST") {
      assertPermission(actorRoleId, PERMISSIONS.USER_MANAGE);
      const body = z.object({
        ids: z.array(z.string().min(1)).min(1),
        status: z.enum(["y", "n"]),
      }).parse(await req.json());
      const placeholders = body.ids.map(() => "?").join(",");
      const [res] = await pool.query<ResultSetHeader>(
        `UPDATE sys_user SET status = ?, update_user_id = ?, update_time = NOW()
         WHERE user_id IN (${placeholders}) AND is_deleted = 0`,
        [body.status, actorId ?? null, ...body.ids],
      );
      return ok({ affected: res.affectedRows });
    }

    // ── sys-org ───────────────────────────────────────────
    if (path === "/v2/sys-org") {
      if (req.method === "GET") {
        assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE, PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE]);
        const query = orgQuerySchema.parse(Object.fromEntries(url.searchParams));
        return ok(await listSysOrgs(query));
      }
      if (req.method === "POST") {
        assertPermission(actorRoleId, PERMISSIONS.ORG_MANAGE);
        const raw = createOrgSchema.parse(await req.json());
        const { school_grade_ids, ...rest } = raw;
        const input = { ...rest, schoolGradeIds: school_grade_ids };
        const roleHeader = req.headers.get("x-role") ?? "";
        const actorOrgId = req.headers.get("x-org-id") ?? "";
        try {
          await assertSysOrgCreateScope({ roleHeader, actorOrgId, input });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "创建被拒绝";
          return fail(msg, 403);
        }
        return ok(await createSysOrg(input, actorId));
      }
    }

    // 必须在 /v2/sys-org/:id 之前匹配，否则 "tree" 会被当成 org_id
    if (path === "/v2/sys-org/tree" && req.method === "GET") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE, PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE]);
      const actorOrgHeader = req.headers.get("x-org-id");
      const rows = await querySysOrgTreeRowsForActor(pool, {
        actorRoleId,
        actorOrgId: actorOrgHeader,
      });
      const orgIds = rows.map((r) => String(r.orgId));
      const gradeMap = await fetchSchoolGradeIdsByOrgIds(orgIds);
      const studentCountMap = await fetchStudentCountsByOrgIds(pool, orgIds);
      const merged = rows.map((r) => ({
        ...r,
        schoolGradeIds: gradeMap.get(String(r.orgId)) ?? [],
        studentCount: studentCountMap.get(String(r.orgId)) ?? 0,
      }));
      return ok(merged);
    }

    const orgMatch = path.match(/^\/v2\/sys-org\/([^/]+)$/);
    if (orgMatch) {
      const orgId = decodeURIComponent(orgMatch[1]!);
      if (req.method === "GET") {
        assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE, PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE]);
        const row = await getSysOrgById(orgId);
        if (!row) return fail("组织不存在", 404);
        return ok(row);
      }
      if (req.method === "PATCH" || req.method === "PUT") {
        assertPermission(actorRoleId, PERMISSIONS.ORG_MANAGE);
        const raw = patchOrgSchema.parse(await req.json());
        const { school_grade_ids, ...rest } = raw;
        const input = {
          ...rest,
          ...(school_grade_ids !== undefined ? { schoolGradeIds: school_grade_ids } : {}),
        };
        return ok(await updateSysOrg(orgId, input, actorId));
      }
      if (req.method === "DELETE") {
        assertPermission(actorRoleId, PERMISSIONS.ORG_MANAGE);
        await deleteSysOrgHard(orgId);
        return ok({ deleted: true });
      }
    }

    // ── sys-msg ───────────────────────────────────────────
    if (path === "/v2/sys-msg" && req.method === "GET") {
      const receiverUserId = url.searchParams.get("receiverUserId");
      if (!receiverUserId) return fail("缺少 receiverUserId", 400);
      const readTag = url.searchParams.get("readTag");
      const msgTypeId = url.searchParams.get("msgTypeId");
      const where = ["receiver_user_id = ?"];
      const params: unknown[] = [receiverUserId];
      if (readTag === "0" || readTag === "1") { where.push("read_tag = ?"); params.push(readTag); }
      if (msgTypeId) { where.push("msg_type_id = ?"); params.push(msgTypeId); }
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT msg_id AS msgId, receiver_user_id AS receiverUserId,
                sender_user_id AS senderUserId, msg_type_id AS msgTypeId,
                biz_type AS bizType,
                msg_content AS msgContent, read_tag AS readTag,
                send_time AS sendTime, read_time AS readTime
         FROM sys_msg WHERE ${where.join(" AND ")}
         ORDER BY send_time DESC LIMIT 50`,
        params,
      );
      return ok(rows);
    }

    if (path === "/v2/sys-msg" && req.method === "POST") {
      assertPermission(actorRoleId, PERMISSIONS.USER_MANAGE);
      const body = sendMsgSchema.parse(await req.json());
      const msgId = await allocateUniqueMysqlVarchar32Id(pool, {
        table: "sys_msg",
        column: "msg_id",
        label: body.msgContent.slice(0, 120),
      });
      await pool.query(
        `INSERT INTO sys_msg (msg_id, receiver_user_id, sender_user_id, msg_type_id, biz_type, msg_content, read_tag, send_time)
         VALUES (?, ?, ?, ?, ?, ?, '0', NOW())`,
        [msgId, body.receiverUserId, actorId ?? null, body.msgTypeId ?? null, body.bizType ?? null, body.msgContent],
      );
      return ok({ msgId });
    }

    // 标记消息为已读
    if (path.startsWith("/v2/sys-msg/") && path.endsWith("/read") && req.method === "POST") {
      const msgId = path.split("/")[3];
      await pool.query(
        `UPDATE sys_msg SET read_tag = '1', read_time = NOW() WHERE msg_id = ?`,
        [msgId],
      );
      return ok({ read: true });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof Error) {
      if (err.message === "SYS_USER_ORG_REQUIRED") return fail("请选择所属组织（学生必须归属到末级节点）", 400);
      if (err.message === "SYS_USER_STUDENT_ORG_MUST_BE_LEAF") return fail("学生必须归属到最后一层级（末级组织）", 400);
      if (err.message === "SYS_ORG_NOT_FOUND") return fail("组织不存在", 404);
      if (err.message === "SYS_ORG_PARENT_NOT_FOUND") {
        return fail("父组织不存在或已删除，无法在该节点下创建子组织", 400);
      }
      if (err.message === "SYS_ORG_CREATE_FAILED") {
        return fail("组织已写入但读取校验失败，请刷新后重试", 500);
      }
      if (err.message === "SYS_ORG_DELETE_BLOCKED_USERS") {
        return fail("存在用户仍绑定该组织或其子组织，无法删除", 409);
      }
      if (err.message === "SYS_ORG_DELETE_BLOCKED_HOMEWORK") {
        return fail("存在试验作业关联该班级组织（含子组织），无法删除", 409);
      }
      if (err.message === "SYS_ORG_DELETE_BLOCKED_QUESTION") {
        return fail("存在题库题目关联该组织（含子组织），无法删除", 409);
      }
      if (err.message === "PRIMARY_KEY_INVALID") {
        return fail("主键格式无效（仅 1–32 位字母、数字、下划线）", 400);
      }
      if (err.message === "ID_ALREADY_USED") return fail("主键已存在，请更换", 409);
      if (err.message.startsWith("权限不足")) return fail(err.message, 403);
      if (/^Data too long for column 'create_user_id'|Data too long for column 'update_user_id'/.test(err.message)) {
        return fail("创建人账号标识过长，已自动截断后重试仍失败，请联系管理员", 500);
      }
      if (/^Duplicate entry /.test(err.message)) {
        return fail("组织名称或主键已存在，请更换后重试", 409);
      }
    }
    console.error("[v2-sys]", err);
    return fail("服务内部错误", 500);
  }
}
