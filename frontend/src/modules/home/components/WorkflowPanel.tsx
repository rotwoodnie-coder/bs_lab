import { FormEvent } from "react";
import type React from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Separator, Textarea } from "@bs-lab/ui";

type WorkflowPanelProps = {
  studentUserId: string;
  experimentId: string;
  videoUrl: string;
  description: string;
  workId: string;
  latestStatus: string;
  canActOnWork: boolean;
  onStudentUserIdChange: (value: string) => void;
  onExperimentIdChange: (value: string) => void;
  onVideoUrlChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreateWork: (event: FormEvent) => void;
  onAiPrecheck: () => void;
  onReview: () => void;
  onPublish: () => void;
};

export function WorkflowPanel(props: WorkflowPanelProps) {
  const {
    studentUserId,
    experimentId,
    videoUrl,
    description,
    workId,
    latestStatus,
    canActOnWork,
    onStudentUserIdChange,
    onExperimentIdChange,
    onVideoUrlChange,
    onDescriptionChange,
    onCreateWork,
    onAiPrecheck,
    onReview,
    onPublish,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student -&gt; AI -&gt; Admin -&gt; Publish</CardTitle>
        <CardDescription>Create a work then run precheck, review and publish in sequence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onCreateWork} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Student User ID</p>
            <Input value={studentUserId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onStudentUserIdChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Experiment ID</p>
            <Input value={experimentId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onExperimentIdChange(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-xs text-muted-foreground">Video URL</p>
            <Input value={videoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onVideoUrlChange(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-xs text-muted-foreground">Description</p>
            <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onDescriptionChange(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">1) Create work</Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline">Current workId: {workId || "-"}</Badge>
          <Badge variant="outline">Latest status: {latestStatus}</Badge>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onAiPrecheck} disabled={!canActOnWork}>
            2) AI precheck (pass)
          </Button>
          <Button variant="outline" onClick={onReview} disabled={!canActOnWork}>
            3) Admin review (approve)
          </Button>
          <Button onClick={onPublish} disabled={!canActOnWork}>
            4) Publish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

