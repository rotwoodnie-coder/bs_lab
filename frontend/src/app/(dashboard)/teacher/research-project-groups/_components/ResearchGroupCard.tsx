"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";
import { Pencil, Power } from "@bs-lab/ui/icons";

import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

export function ResearchGroupCard(props: {
  row: V2SysOrgItem;
  onEdit: (row: V2SysOrgItem) => void;
  onToggleStatus: (row: V2SysOrgItem) => void;
}) {
  const { row, onEdit, onToggleStatus } = props;
  const active = (row.status ?? "y") === "y";
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{row.orgName}</CardTitle>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="font-mono">groupId={row.orgId}</span>
          </div>
        </div>
        <Badge variant={active ? "secondary" : "outline"}>{active ? "启用" : "停用"}</Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(row)}>
          <Pencil className="mr-1 size-4" />
          编辑
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onToggleStatus(row)}>
          <Power className="mr-1 size-4" />
          {active ? "停用" : "启用"}
        </Button>
      </CardContent>
    </Card>
  );
}
