"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";
import { Eye, Pencil } from "@bs-lab/ui/icons";

import type { TeacherGroupRow } from "../page.hooks";

export function ResearchGroupCard(props: {
  row: TeacherGroupRow;
  currentUserId: string;
  onEdit: (row: TeacherGroupRow) => void;
  onViewDetail: (row: TeacherGroupRow) => void;
}) {
  const { row, currentUserId, onEdit, onViewDetail } = props;
  const active = (row.status ?? "Y") === "Y";

  // 管理员判断：负责人（owner）即为管理员，或成员的系统身份为教研员（member.role === "ADMIN"）
  const isAdmin =
    row.ownerId === currentUserId ||
    row.members.some((m) => m.userId === currentUserId && m.role === "ADMIN");

  return (
    <Card className="overflow-hidden border-border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 bg-gradient-to-br from-background to-muted/20 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base leading-tight">{row.groupName}</CardTitle>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {row.subjectName ? <span>学科：{row.subjectName}</span> : null}
            <span>负责人：{row.ownerName ?? row.ownerId ?? "—"}</span>
            <span>成员：{row.memberCount ?? "—"} 人</span>
            <span>资源：— 个</span>
          </div>
          {row.comments ? <p className="line-clamp-2 text-xs text-muted-foreground">{row.comments}</p> : null}
        </div>
        <Badge variant={active ? "secondary" : "outline"}>{active ? "启用" : "停用"}</Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 p-4 pt-3">
        <Button type="button" size="sm" variant="outline" onClick={() => onViewDetail(row)}>
          <Eye className="mr-1 size-4" />
          详情
        </Button>
        {isAdmin ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(row)}>
            <Pencil className="mr-1 size-4" />
            编辑
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
