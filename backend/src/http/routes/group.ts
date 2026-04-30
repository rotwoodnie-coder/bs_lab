import { z } from "zod";
import { assertAnyPermission } from "../../lib/auth/permission-guard.ts";
import { PERMISSIONS } from "../../lib/auth/role-permissions.ts";
import {
  addSubjectGroupMember,
  canJoinSubjectGroup,
  createSubjectGroup,
  getSubjectGroupById,
  isSubjectGroupManager,
  listSubjectGroupMembers,
  listSubjectGroups,
  patchSubjectGroup,
  removeSubjectGroupMember,
  transferSubjectGroupOwner,
} from "../../infrastructure/repositories/subject-group-repository.ts";
import { getSysUserById } from "../../infrastructure/repositories/v2-sys-user-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const id32Token = z.string().min(1).max(32).regex(/^[a-zA-Z0-9_]+$/);
const subjectGroupSchema = z.object({
  group_name: z.string().min(1).max(60),
  comments: z.string().max(100).nullable().optional(),
  status: z.enum(["Y", "N"]).optional(),
  subject_id: z.string().max(32).nullable().optional(),
  owner_id: z.string().max(32).nullable().optional(),
});
const transferSchema = z.object({ group_id: id32Token, new_owner_id: id32Token });
const addMemberSchema = z.object({ group_id: id32Token, user_id: id32Token });

function inferGroupType(group: { groupName: string; subjectId: string | null }): "research_group" | "subject_group" {
  const name = group.groupName.trim().toLowerCase();
  if (name.includes("教研") || name.includes("research")) return "research_group";
  if (group.subjectId) return "subject_group";
  return "research_group";
}

function normalizeRoleKey(role: string | null | undefined): string {
  const raw = String(role ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (["teacher", "教师"].includes(raw)) return "TEACHER";
  if (["researcher", "教研员", "教研"].includes(raw)) return "RESEARCHER";
  if (["student", "学生"].includes(raw)) return "STUDENT";
  if (["super_admin", "system_admin", "系统管理员", "超级管理员"].includes(raw)) return "SUPER_ADMIN";
  if (["district_admin", "区管理员", "区级管理员"].includes(raw)) return "DISTRICT_ADMIN";
  if (["school_admin", "学校管理员", "管理员"].includes(raw)) return "SCHOOL_ADMIN";
  if (["parent", "家长"].includes(raw)) return "PARENT";
  return raw.toUpperCase();
}

export async function routeGroup(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const actorId = req.headers.get("x-user-id") ?? undefined;
    const actorRoleId = req.headers.get("x-role-id") ?? req.headers.get("x-role") ?? undefined;

    if (path === "/v2/group" && req.method === "GET") return ok(await listSubjectGroups());

    if (path === "/v2/group" && req.method === "POST") {
      assertAnyPermission(actorRoleId, [PERMISSIONS.ORG_MANAGE, PERMISSIONS.USER_MANAGE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.SYSTEM_DICT_WRITE]);
      const body = subjectGroupSchema.parse(await req.json());
      return ok(await createSubjectGroup({
        groupName: body.group_name,
        comments: body.comments,
        status: body.status,
        subjectId: body.subject_id,
        ownerId: body.owner_id,
      }, actorId));
    }

    if (path === "/v2/group/transfer" && req.method === "POST") {
      const body = transferSchema.parse(await req.json());
      if (!(await isSubjectGroupManager({ userId: actorId ?? "", groupId: body.group_id, role: String(actorRoleId ?? "") }))) {
        return fail("权限不足：group_transfer", 403);
      }
      return ok(await transferSubjectGroupOwner(body.group_id, body.new_owner_id, actorId));
    }

    const groupMatch = path.match(/^\/v2\/group\/([^/]+)$/);
    if (groupMatch) {
      const groupId = decodeURIComponent(groupMatch[1]!);
      if (req.method === "GET") {
        const row = await getSubjectGroupById(groupId);
        if (!row) return fail("组不存在", 404);
        return ok(row);
      }
      if (req.method === "PATCH") {
        const body = subjectGroupSchema.partial().parse(await req.json());
        return ok(await patchSubjectGroup(groupId, {
          groupName: body.group_name,
          comments: body.comments,
          status: body.status,
          subjectId: body.subject_id,
          ownerId: body.owner_id,
        }, actorId));
      }
    }

    const membersMatch = path.match(/^\/v2\/group\/([^/]+)\/members$/);
    if (membersMatch && req.method === "GET") {
      const groupId = decodeURIComponent(membersMatch[1]!);
      return ok(await listSubjectGroupMembers(groupId));
    }

    if (path === "/v2/group/members" && req.method === "POST") {
      const body = addMemberSchema.parse(await req.json());
      const group = await getSubjectGroupById(body.group_id);
      if (!group) return fail("组不存在", 404);
      const user = await getSysUserById(body.user_id);
      if (!user) return fail("用户不存在", 404);
      const userRole = normalizeRoleKey(user.roleName ?? user.userRoleId ?? "");
      const groupType = inferGroupType(group);
      if (!canJoinSubjectGroup({ groupType, userRole })) {
        return fail(groupType === "research_group" ? "教研组不允许该身份加入" : "该身份不允许加入此课题组", 403);
      }
      return ok(await addSubjectGroupMember(body.group_id, body.user_id, actorId));
    }

    const memberMatch = path.match(/^\/v2\/group\/members\/([^/]+)$/);
    if (memberMatch && req.method === "DELETE") {
      const seqId = decodeURIComponent(memberMatch[1]!);
      await removeSubjectGroupMember(seqId);
      return ok({ deleted: true });
    }

    return new Response(null, { status: 404 });
  } catch (err) {
    if (err instanceof z.ZodError) return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    if (err instanceof Error) {
      if (err.message.startsWith("权限不足")) return fail(err.message, 403);
      if (err.message === "SUBJECT_GROUP_NOT_FOUND") return fail("组不存在", 404);
      if (err.message === "SUBJECT_GROUP_CREATE_FAILED") return fail("创建失败", 500);
      if (err.message === "SUBJECT_GROUP_MEMBER_EXISTS") return fail("成员已存在", 409);
    }
    console.error("[group]", err);
    return fail("服务内部错误", 500);
  }
}
