"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";

import { MediaAssetPickerDialog } from "@/components/business/media/MediaAssetPickerDialog";
import { experimentCatalogDemoStreamActor } from "@/lib/experiment-catalog-api";
import { fetchExperimentalMaterials } from "@/lib/experimental-materials-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { UserRole } from "@/types/auth";

import type { ExperimentalMaterialRecord } from "@/data/experimental-materials";
import type { MediaKind } from "@/lib/media-platform/types";

type EditionRow = { id: string; name: string; code: string };

const NONE = "__none__";

type FormsMode = "chapter" | "materials";

export function ExperimentCatalogEdgeSubmitForms(props: {
  mode: FormsMode;
  role: UserRole;
  orgId: string;
  canManage: boolean;
  edgeDirectMode: boolean;
  cTextbook: string;
  setCTextbook: (v: string) => void;
  cChapter: string;
  setCChapter: (v: string) => void;
  cEdition: string;
  setCEdition: (v: string) => void;
  mMat: string;
  setMMat: (v: string) => void;
  mQty: string;
  setMQty: (v: string) => void;
  mUnit: string;
  setMUnit: (v: string) => void;
  mReg: string;
  setMReg: (v: string) => void;
  mKind: string;
  setMKind: (v: string) => void;
  onSubmitChapter: () => void;
  onSubmitMaterial: () => void;
  onSubmitMedia: () => void;
}) {
  const [editions, setEditions] = React.useState<EditionRow[]>([]);
  const [materials, setMaterials] = React.useState<ExperimentalMaterialRecord[]>([]);
  const [matFilter, setMatFilter] = React.useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);
  const [matLoadErr, setMatLoadErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (props.mode !== "chapter") return;
    let cancelled = false;
    void fetch("/api/edu/editions")
      .then((r) => r.json())
      .then((data: { editions?: EditionRow[] }) => {
        if (!cancelled) setEditions(Array.isArray(data.editions) ? data.editions : []);
      })
      .catch(() => {
        if (!cancelled) setEditions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [props.mode]);

  React.useEffect(() => {
    if (props.mode !== "materials") return;
    let cancelled = false;
    const actor = buildMaterialsApiActor(props.role, props.orgId, "catalog-experiment-detail");
    void fetchExperimentalMaterials(actor)
      .then((rows) => {
        if (!cancelled) {
          setMaterials(rows);
          setMatLoadErr(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setMaterials([]);
          setMatLoadErr(e instanceof Error ? e.message : "加载实验材料列表失败");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [props.mode, props.role, props.orgId]);

  const mediaActor = React.useMemo(
    () => experimentCatalogDemoStreamActor(props.role, props.orgId),
    [props.role, props.orgId],
  );

  const filteredMaterials = React.useMemo(() => {
    if (props.mode !== "materials") return [];
    const q = matFilter.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => m.name.toLowerCase().includes(q));
  }, [props.mode, materials, matFilter]);

  const selectedMaterial = React.useMemo(() => {
    if (props.mode !== "materials") return null;
    return materials.find((m) => m.id === props.mMat.trim()) ?? null;
  }, [props.mode, materials, props.mMat]);

  const direct = props.edgeDirectMode && props.canManage;
  const mediaPickKind: MediaKind = props.mKind.trim().toUpperCase() === "IMAGE" ? "image" : "video";

  if (props.mode === "chapter") {
    return (
      <Card className="border-border shadow-none">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">
            {direct ? "提交映射（管理员直通）" : "提交众筹候选（引用即沉淀）"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            章节目录主数据未全量接入时，教材与章节请填写与系统一致的<strong>业务引用标识</strong>；可选选择教材版本以便展示与对账。
          </p>
          <div className="space-y-1">
            <Label>教材版本（可选）</Label>
            <Select
              value={props.cEdition.trim() ? props.cEdition : NONE}
              onValueChange={(v) => props.setCEdition(v === NONE ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="不指定版本" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>不指定版本</SelectItem>
                {editions.map((ed) => (
                  <SelectItem key={ed.id} value={ed.id}>
                    {ed.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>教材业务引用</Label>
              <Input
                placeholder="与后端教材主数据一致的标识"
                value={props.cTextbook}
                onChange={(e) => props.setCTextbook(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>章节业务引用</Label>
              <Input
                placeholder="与后端章节主数据一致的标识"
                value={props.cChapter}
                onChange={(e) => props.setCChapter(e.target.value)}
              />
            </div>
          </div>
          <Button type="button" size="sm" onClick={props.onSubmitChapter}>
            {direct ? "提交章节（直通已通过）" : "提交章节映射"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border shadow-none">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">提交材料映射</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {matLoadErr ? <p className="text-xs text-destructive">{matLoadErr}</p> : null}
          <div className="space-y-1">
            <Label>实验材料</Label>
            <Input
              placeholder="按名称筛选列表"
              value={matFilter}
              onChange={(e) => setMatFilter(e.target.value)}
              className="max-w-md"
            />
            <Select value={props.mMat.trim() ? props.mMat : NONE} onValueChange={(v) => props.setMMat(v === NONE ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择材料" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value={NONE}>请选择材料</SelectItem>
                {filteredMaterials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMaterial ? (
              <p className="text-xs text-muted-foreground">已选：{selectedMaterial.name}</p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>建议数量</Label>
              <Input placeholder="数量" value={props.mQty} onChange={(e) => props.setMQty(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>单位</Label>
              <Input placeholder="单位" value={props.mUnit} onChange={(e) => props.setMUnit(e.target.value)} />
            </div>
          </div>
          <Button type="button" size="sm" onClick={props.onSubmitMaterial}>
            {direct ? "提交材料（直通已通过）" : "提交材料候选"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">提交推荐媒体映射</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-foreground">
              {props.mReg.trim() ? "已选择媒体库中的视频素材" : "尚未选择媒体"}
            </p>
            <Button type="button" size="sm" variant="secondary" onClick={() => setMediaPickerOpen(true)}>
              {mediaPickKind === "image" ? "从媒体库选择图片" : "从媒体库选择视频"}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!props.mReg.trim()} onClick={() => props.setMReg("")}>
              清除
            </Button>
          </div>
          <div className="space-y-1">
            <Label>媒体类型</Label>
            <Select value={props.mKind} onValueChange={props.setMKind}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">视频</SelectItem>
                <SelectItem value="IMAGE">图片</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={props.onSubmitMedia}>
            {direct ? "提交媒体（直通已通过）" : "提交媒体候选"}
          </Button>
          <MediaAssetPickerDialog
            open={mediaPickerOpen}
            onOpenChange={setMediaPickerOpen}
            kind={mediaPickKind}
            actor={mediaActor}
            onPick={(id) => {
              props.setMReg(id.trim());
              setMediaPickerOpen(false);
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
