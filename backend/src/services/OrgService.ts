import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { V2_ORG_TYPE_IDS } from "../domain/v2-sys/v2-org-type-constants.ts";

export async function deleteOrgNode(
  conn: PoolConnection,
  orgId: string,
  actorId: string,
): Promise<void> {
  const [orgRows] = await conn.query<RowDataPacket[]>(
    `SELECT org_id AS orgId, org_type_id AS orgTypeId
     FROM sys_org WHERE org_id = ? AND is_deleted = 0 FOR UPDATE`,
    [orgId],
  );
  if (orgRows.length === 0) throw new Error("SYS_ORG_NOT_FOUND");

  await conn.query(
    `
      UPDATE sys_org
      SET is_deleted = 1,
          update_user_id = ?,
          update_time = NOW()
      WHERE org_id = ?
        AND is_deleted = 0
    `,
    [actorId, orgId],
  );

  if (String(orgRows[0]!.orgTypeId) === V2_ORG_TYPE_IDS.class) {
    await conn.query(`DELETE FROM sys_user_role WHERE org_id = ?`, [orgId]);
  }
}
