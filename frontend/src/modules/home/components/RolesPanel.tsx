import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@bs-lab/ui";
import type React from "react";

type RolesPanelProps = {
  assetTitle: string;
  teacherAssetsCount: number;
  sessionId: string;
  onAssetTitleChange: (value: string) => void;
  onTeacherAsset: () => void;
  onParentReport: () => void;
};

export function RolesPanel({
  assetTitle,
  teacherAssetsCount,
  sessionId,
  onAssetTitleChange,
  onTeacherAsset,
  onParentReport,
}: RolesPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Teacher baseline</CardTitle>
          <CardDescription>Create and list teacher assets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Asset title</p>
            <Input value={assetTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAssetTitleChange(e.target.value)} />
          </div>
          <Button onClick={onTeacherAsset}>Create + list teacher assets</Button>
          <Badge variant="outline">Teacher assets count: {teacherAssetsCount}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parent baseline</CardTitle>
          <CardDescription>Create a session and generate report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={onParentReport}>Create session + report</Button>
          <Badge variant="outline">Latest parent session id: {sessionId || "-"}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

