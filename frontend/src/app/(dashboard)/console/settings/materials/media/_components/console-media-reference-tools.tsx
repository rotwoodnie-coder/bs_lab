"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
  Switch,
} from "@bs-lab/ui";
import type { MediaActor } from "../page.api";
import { createMediaReference, getMediaRegistry, listMediaReferences, upgradeMediaReferenceRegistry } from "../page.api";
import type { MediaCreateReferenceInput, MediaReferenceRecord } from "../page.types";

type Props = {
  actor: MediaActor;
  onCompleted: () => Promise<void>;
};

function CreateReferenceForm({ actor, onCompleted }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<MediaCreateReferenceInput>({
    targetKind: "REGISTRY",
    targetId: "",
    refType: "EXPERIMENT_STEP",
    refId: "",
    slotKey: "",
    sortOrder: 0,
  });

  const setField = <K extends keyof MediaCreateReferenceInput>(key: K, value: MediaCreateReferenceInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (!form.targetId.trim() || !form.refType.trim() || !form.refId.trim()) {
      return sonnerToast.error("请填写引用目标与业务节点信息");
    }
    setLoading(true);
    try {
      await createMediaReference(actor, {
        ...form,
        targetId: form.targetId.trim(),
        refType: form.refType.trim(),
        refId: form.refId.trim(),
        slotKey: form.slotKey?.trim() || undefined,
      });
      sonnerToast.success("已创建引用");
      await onCompleted();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "创建引用失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="text-sm font-medium text-foreground">创建引用</div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ref-target-kind">目标类型</Label>
          <Select
            value={form.targetKind}
            onValueChange={(value) => setField("targetKind", value as MediaCreateReferenceInput["targetKind"])}
          >
            <SelectTrigger id="ref-target-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REGISTRY">登记资源</SelectItem>
              <SelectItem value="SEGMENT">视频片段</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ref-target-id">目标 ID</Label>
          <Input id="ref-target-id" value={form.targetId} onChange={(e) => setField("targetId", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ref-type">业务类型</Label>
          <Input id="ref-type" value={form.refType} onChange={(e) => setField("refType", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ref-id">业务 ID</Label>
          <Input id="ref-id" value={form.refId} onChange={(e) => setField("refId", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slot-key">槽位键（可选）</Label>
          <Input id="slot-key" value={form.slotKey ?? ""} onChange={(e) => setField("slotKey", e.target.value)} />
        </div>
      </div>
      <Button type="button" size="sm" onClick={() => void submit()} disabled={loading}>
        {loading ? "创建中…" : "创建引用"}
      </Button>
    </div>
  );
}

function ReferenceListPanel({
  references,
  loading,
}: {
  references: MediaReferenceRecord[];
  loading: boolean;
}) {
  if (loading) return <div className="text-xs text-muted-foreground">加载中…</div>;
  if (references.length === 0) return <div className="text-xs text-muted-foreground">当前业务节点暂无引用。</div>;
  return (
    <div className="space-y-2">
      {references.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2">
          <div className="space-y-1">
            <div className="text-sm text-foreground">{item.id}</div>
            <div className="text-xs text-muted-foreground">
              目标 {item.targetKind}:{item.targetId} · 冻结版本 v{item.refVersion}
            </div>
          </div>
          <Badge variant="outline">{item.refType}</Badge>
        </div>
      ))}
    </div>
  );
}

function QueryAndUpgradePanel({ actor, onCompleted }: Props) {
  const [refType, setRefType] = React.useState("EXPERIMENT_STEP");
  const [refId, setRefId] = React.useState("");
  const [targetRegistryId, setTargetRegistryId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [references, setReferences] = React.useState<MediaReferenceRecord[]>([]);
  const [candidates, setCandidates] = React.useState<MediaReferenceRecord[]>([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [publishedOnly, setPublishedOnly] = React.useState(true);

  const loadRefs = async () => {
    if (!refType.trim() || !refId.trim()) return sonnerToast.error("请填写业务类型和业务 ID");
    setLoading(true);
    try {
      const list = await listMediaReferences(actor, refType.trim(), refId.trim());
      setReferences(list);
      sonnerToast.success(`已查询 ${list.length} 条引用`);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "查询引用失败");
    } finally {
      setLoading(false);
    }
  };

  const calculateCandidates = async (): Promise<MediaReferenceRecord[]> => {
    if (!targetRegistryId.trim()) {
      sonnerToast.error("请填写目标登记 ID");
      return [];
    }
    if (!refType.trim() || !refId.trim()) {
      sonnerToast.error("请先填写业务节点");
      return [];
    }
    const latest = await getMediaRegistry(actor, targetRegistryId.trim());
    const list = references.length > 0 ? references : await listMediaReferences(actor, refType.trim(), refId.trim());
    const registryRefs = list.filter((item) => item.targetKind === "REGISTRY");
    if (registryRefs.length === 0) return [];
    const next: MediaReferenceRecord[] = [];
    for (const ref of registryRefs) {
      const current = await getMediaRegistry(actor, ref.targetId);
      if (publishedOnly && current.reviewStatus !== "PUBLISHED") continue;
      if (current.registryGroupId === latest.registryGroupId && current.versionNumber < latest.versionNumber) {
        next.push(ref);
      }
    }
    return next;
  };

  const previewUpgrade = async () => {
    if (!targetRegistryId.trim()) return sonnerToast.error("请填写目标登记 ID");
    if (!refType.trim() || !refId.trim()) return sonnerToast.error("请先填写业务节点");
    setLoading(true);
    try {
      const next = await calculateCandidates();
      setCandidates(next);
      if (next.length === 0) {
        sonnerToast.success("无需升级，已是最新版本或不在同族谱");
        return;
      }
      setConfirmOpen(true);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "生成升级预览失败");
    } finally {
      setLoading(false);
    }
  };

  const executeUpgrade = async () => {
    if (candidates.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        candidates.map((ref) => upgradeMediaReferenceRegistry(actor, ref.id, targetRegistryId.trim())),
      );
      sonnerToast.success(`已升级 ${candidates.length} 条旧引用`);
      setConfirmOpen(false);
      await loadRefs();
      await onCompleted();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "批量升级失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="text-sm font-medium text-foreground">查看业务节点引用 + 一键升级同族谱旧引用</div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="q-ref-type">业务类型</Label>
          <Input id="q-ref-type" value={refType} onChange={(e) => setRefType(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="q-ref-id">业务 ID</Label>
          <Input id="q-ref-id" value={refId} onChange={(e) => setRefId(e.target.value)} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="target-registry-id">目标登记 ID（新版本）</Label>
          <Input
            id="target-registry-id"
            value={targetRegistryId}
            onChange={(e) => setTargetRegistryId(e.target.value)}
            placeholder="用于批量升级同族谱旧引用"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => void loadRefs()} disabled={loading}>
          查询引用列表
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void previewUpgrade()} disabled={loading}>
          升级预览
        </Button>
        <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
          <span className="text-xs text-muted-foreground">仅升级已发布目标引用</span>
          <Switch checked={publishedOnly} onCheckedChange={(v) => setPublishedOnly(Boolean(v))} />
        </div>
      </div>
      <ReferenceListPanel references={references} loading={loading} />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认升级引用</AlertDialogTitle>
            <AlertDialogDescription>
              将升级 {candidates.length} 条同族谱旧引用到登记 {targetRegistryId.slice(0, 8)}...。
              {publishedOnly ? "（仅包含当前目标为已发布状态的引用）" : ""}
              请确认本次升级清单后再执行。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-48 space-y-2 overflow-auto rounded-md border border-border p-2">
            {candidates.map((item) => (
              <div key={item.id} className="text-xs text-muted-foreground">
                {item.id} · 当前目标 {item.targetId} · 冻结版本 v{item.refVersion}
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void executeUpgrade()}>确认执行升级</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ConsoleMediaReferenceTools(props: Props) {
  return (
    <Card className="border-border shadow-none">
      <CardContent className="space-y-3 p-4">
        <CreateReferenceForm {...props} />
        <QueryAndUpgradePanel {...props} />
      </CardContent>
    </Card>
  );
}
