import { cookies } from "next/headers";

import { DEMO_USER_ROLE_COOKIE_NAME, isKnownUserRole } from "@/lib/demo-role-cookie";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";
import type { ExperimentViewCapabilities } from "@/types/experiment-view-permissions";

async function resolveRoleFromCookie(): Promise<UserRole> {
  const jar = await cookies();
  const raw = jar.get(DEMO_USER_ROLE_COOKIE_NAME)?.value;
  const decoded = raw ? decodeURIComponent(raw) : undefined;
  return isKnownUserRole(decoded) ? decoded : UserRole.STUDENT;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: experimentId } = await context.params;
  const role = await resolveRoleFromCookie();

  const showAuditBar = role === UserRole.RESEARCHER || isSuperUserRole(role);
  const showSubmissionBar = role === UserRole.STUDENT;

  const capabilities: ExperimentViewCapabilities = {
    showAuditBar,
    showSubmissionBar,
  };

  return Response.json({
    experimentId,
    resolvedRole: role,
    capabilities,
  });
}
