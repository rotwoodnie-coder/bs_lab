/* eslint-disable react/no-unescaped-entities */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bs-lab/ui";
import { FeedPanel } from "./components/FeedPanel";
import { RolesPanel } from "./components/RolesPanel";
import { ShellHeader } from "./components/ShellHeader";
import { WorkflowPanel } from "./components/WorkflowPanel";
import type { WorkRecord } from "./types";

export default function HomeShell() {
  const [studentUserId, setStudentUserId] = useState("demo-student-1");
  const [experimentId, setExperimentId] = useState("exp-chem-001");
  const [videoUrl, setVideoUrl] = useState("https://example.com/work-video.mp4");
  const [description, setDescription] = useState("Student first submission");
  const [workId, setWorkId] = useState<string>("");
  const [latestStatus, setLatestStatus] = useState<string>("-");
  const [feed, setFeed] = useState<WorkRecord[]>([]);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [assetTitle, setAssetTitle] = useState<string>("Grade 4 Gravity Worksheet");
  const [teacherAssetsCount, setTeacherAssetsCount] = useState<number>(0);

  const canActOnWork = useMemo(() => workId.length > 0, [workId]);

  function newLocalId(prefix: string): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}`;
  }

  async function handleCreateWork(event: FormEvent) {
    event.preventDefault();
    setError("");
    const id = newLocalId("work");
    setWorkId(id);
    setLatestStatus("submitted");
    setMessage(`已创建本地作业（${id}）。后端已切换 V2，旧版 /v1/works 不再可用。`);
  }

  async function handleAiPrecheck() {
    if (!canActOnWork) {
      return;
    }
    setError("");
    setLatestStatus("ai_prechecked");
    setMessage("本地：AI 预审已完成（无 /v1 接口）。");
  }

  async function handleReview() {
    if (!canActOnWork) {
      return;
    }
    setError("");
    setLatestStatus("reviewed");
    setMessage("本地：审核已通过（无 /v1 接口）。");
  }

  async function handlePublish() {
    if (!canActOnWork) {
      return;
    }
    setError("");
    setLatestStatus("published");
    setMessage("本地：作业已发布（无 /v1 接口）。");
  }

  async function handleLoadFeed() {
    setError("");
    setFeed([]);
    setMessage("动态流：后端为 V2，旧版 /v1/feed 已移除，此处返回空列表。");
  }

  async function handleTeacherAsset() {
    setError("");
    setTeacherAssetsCount(1);
    setMessage("教师素材：已切换 V2，旧版 /v1/teacher-assets 不再调用；此处为占位计数。");
  }

  async function handleParentReport() {
    setError("");
    const sid = newLocalId("session");
    setSessionId(sid);
    setMessage(`家长报告：会话 ${sid}（本地占位）。旧版 /v1/parent-* 已移除。`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <ShellHeader message={message} error={error} />

      <Tabs defaultValue="workflow" className="gap-4">
        <TabsList>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="roles">Teacher & Parent</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <WorkflowPanel
            studentUserId={studentUserId}
            experimentId={experimentId}
            videoUrl={videoUrl}
            description={description}
            workId={workId}
            latestStatus={latestStatus}
            canActOnWork={canActOnWork}
            onStudentUserIdChange={setStudentUserId}
            onExperimentIdChange={setExperimentId}
            onVideoUrlChange={setVideoUrl}
            onDescriptionChange={setDescription}
            onCreateWork={handleCreateWork}
            onAiPrecheck={handleAiPrecheck}
            onReview={handleReview}
            onPublish={handlePublish}
          />
        </TabsContent>

        <TabsContent value="feed">
          <FeedPanel feed={feed} onLoadFeed={handleLoadFeed} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesPanel
            assetTitle={assetTitle}
            teacherAssetsCount={teacherAssetsCount}
            sessionId={sessionId}
            onAssetTitleChange={setAssetTitle}
            onTeacherAsset={handleTeacherAsset}
            onParentReport={handleParentReport}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
