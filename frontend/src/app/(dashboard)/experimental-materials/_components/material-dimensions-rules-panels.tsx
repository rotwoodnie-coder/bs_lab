"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import type { ExperimentalMaterialDimensionsApiResponse } from "@/lib/experimental-materials-api";
import { MaterialDimensionsDataTable } from "./material-dimensions-data-table";
import {
  riskLabel,
  type RiskLevel,
  type CategoryRow,
  type TagRow,
  type TypeRow,
  useCategoryColumns,
  useTagColumns,
  useTypeColumns,
} from "./material-dimensions-table-columns";

export function MaterialDimensionsRulesPanels(props: {
  section: "material-type" | "material-category" | "risk";
  canMaintain: boolean;
  loading: boolean;
  dimensions: ExperimentalMaterialDimensionsApiResponse | null;
  createType: (body: { code: string; name: string; displayName: string; sortOrder: number }) => Promise<void>;
  updateType: (code: string, body: { name: string; displayName: string; sortOrder: number }) => Promise<void>;
  deleteType: (code: string) => Promise<void>;
  createCategory: (body: { code: string; name: string; sortOrder: number; parentCode?: string | null }) => Promise<void>;
  updateCategory: (code: string, body: { name: string; sortOrder: number; parentCode?: string | null }) => Promise<void>;
  deleteCategory: (code: string) => Promise<void>;
  createSafetyTag: (body: { code: string; name: string; riskLevel: RiskLevel; sortOrder: number }) => Promise<void>;
  updateSafetyTag: (code: string, body: { name: string; riskLevel: RiskLevel; sortOrder: number }) => Promise<void>;
  deleteSafetyTag: (code: string) => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [typeDraft, setTypeDraft] = React.useState({ code: "", name: "", displayName: "", sortOrder: "10" });
  const [categoryDraft, setCategoryDraft] = React.useState({ code: "", name: "", sortOrder: "10", parentCode: "" });
  const [tagDraft, setTagDraft] = React.useState({ code: "", name: "", riskLevel: "low" as RiskLevel, sortOrder: "10" });
  const [editingTypeCode, setEditingTypeCode] = React.useState<string | null>(null);
  const [editingCategoryCode, setEditingCategoryCode] = React.useState<string | null>(null);
  const [editingTagCode, setEditingTagCode] = React.useState<string | null>(null);

  const categories = props.dimensions?.categories ?? [];
  const typeRows = React.useMemo<TypeRow[]>(
    () => (props.dimensions?.types ?? []).map((row) => ({ ...row, id: row.code })),
    [props.dimensions?.types],
  );
  const categoryRows = React.useMemo<CategoryRow[]>(
    () => categories.map((row) => ({ ...row, id: row.code })),
    [categories],
  );
  const tagRows = React.useMemo<TagRow[]>(
    () => (props.dimensions?.safetyTags ?? []).map((row) => ({ ...row, id: row.code, riskLevel: row.riskLevel as RiskLevel })),
    [props.dimensions?.safetyTags],
  );

  const typeColumns = useTypeColumns({
    canMaintain: props.canMaintain,
    busy,
    onEdit: (row) => {
      setEditingTypeCode(row.code);
      setTypeDraft({
        code: row.code,
        name: row.name,
        displayName: row.displayName,
        sortOrder: String(row.sortOrder),
      });
    },
    onDelete: (code) => void props.deleteType(code),
  });
  const categoryColumns = useCategoryColumns({
    canMaintain: props.canMaintain,
    busy,
    onEdit: (row) => {
      setEditingCategoryCode(row.code);
      setCategoryDraft({
        code: row.code,
        name: row.name,
        sortOrder: String(row.sortOrder),
        parentCode: row.parentCode ?? "",
      });
    },
    onDelete: (code) => void props.deleteCategory(code),
  });
  const tagColumns = useTagColumns({
    canMaintain: props.canMaintain,
    busy,
    onEdit: (row) => {
      setEditingTagCode(row.code);
      setTagDraft({
        code: row.code,
        name: row.name,
        riskLevel: row.riskLevel,
        sortOrder: String(row.sortOrder),
      });
    },
    onDelete: (code) => void props.deleteSafetyTag(code),
  });

  async function submitType() {
    if (!typeDraft.name.trim() || !typeDraft.displayName.trim()) return;
    setBusy(true);
    try {
      const sortOrder = Number(typeDraft.sortOrder) || 0;
      if (editingTypeCode) await props.updateType(editingTypeCode, { name: typeDraft.name.trim(), displayName: typeDraft.displayName.trim(), sortOrder });
      else await props.createType({ code: typeDraft.code.trim(), name: typeDraft.name.trim(), displayName: typeDraft.displayName.trim(), sortOrder });
      setEditingTypeCode(null);
      setTypeDraft({ code: "", name: "", displayName: "", sortOrder: "10" });
    } finally {
      setBusy(false);
    }
  }
  async function submitCategory() {
    if (!categoryDraft.name.trim()) return;
    setBusy(true);
    try {
      const sortOrder = Number(categoryDraft.sortOrder) || 0;
      const parentCode = categoryDraft.parentCode.trim() || null;
      if (editingCategoryCode) await props.updateCategory(editingCategoryCode, { name: categoryDraft.name.trim(), sortOrder, parentCode });
      else await props.createCategory({ code: categoryDraft.code.trim(), name: categoryDraft.name.trim(), sortOrder, parentCode });
      setEditingCategoryCode(null);
      setCategoryDraft({ code: "", name: "", sortOrder: "10", parentCode: "" });
    } finally {
      setBusy(false);
    }
  }
  async function submitTag() {
    if (!tagDraft.name.trim()) return;
    setBusy(true);
    try {
      const sortOrder = Number(tagDraft.sortOrder) || 0;
      if (editingTagCode) await props.updateSafetyTag(editingTagCode, { name: tagDraft.name.trim(), riskLevel: tagDraft.riskLevel, sortOrder });
      else await props.createSafetyTag({ code: tagDraft.code.trim(), name: tagDraft.name.trim(), riskLevel: tagDraft.riskLevel, sortOrder });
      setEditingTagCode(null);
      setTagDraft({ code: "", name: "", riskLevel: "low", sortOrder: "10" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        {props.section === "material-type" ? (
          <Button type="button" size="sm" disabled={!props.canMaintain || busy} onClick={() => setEditingTypeCode("__new__")}>
            新增属性
          </Button>
        ) : null}
        {props.section === "material-category" ? (
          <Button type="button" size="sm" disabled={!props.canMaintain || busy} onClick={() => setEditingCategoryCode("__new__")}>
            新增分类
          </Button>
        ) : null}
        {props.section === "risk" ? (
          <Button type="button" size="sm" disabled={!props.canMaintain || busy} onClick={() => setEditingTagCode("__new__")}>
            新增风险提示
          </Button>
        ) : null}
      </div>
      {props.section === "material-type" ? (
        <MaterialDimensionsDataTable rows={typeRows} columns={typeColumns} emptyText={props.loading ? "加载中…" : "暂无材料属性"} />
      ) : null}
      {props.section === "material-category" ? (
        <MaterialDimensionsDataTable rows={categoryRows} columns={categoryColumns} emptyText={props.loading ? "加载中…" : "暂无材料分类"} />
      ) : null}
      {props.section === "risk" ? (
        <MaterialDimensionsDataTable rows={tagRows} columns={tagColumns} emptyText={props.loading ? "加载中…" : "暂无风险提示"} />
      ) : null}

      <Dialog open={Boolean(editingTypeCode)} onOpenChange={(open) => !open && setEditingTypeCode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTypeCode === "__new__" ? "新增材料属性" : "编辑材料属性"}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>编码</Label><Input disabled={editingTypeCode !== "__new__"} value={typeDraft.code} onChange={(e) => setTypeDraft((p) => ({ ...p, code: e.target.value }))} />
            <Label>名称</Label><Input value={typeDraft.name} onChange={(e) => setTypeDraft((p) => ({ ...p, name: e.target.value }))} />
            <Label>展示文案</Label><Input value={typeDraft.displayName} onChange={(e) => setTypeDraft((p) => ({ ...p, displayName: e.target.value }))} />
            <Label>排序</Label><Input inputMode="numeric" value={typeDraft.sortOrder} onChange={(e) => setTypeDraft((p) => ({ ...p, sortOrder: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingTypeCode(null)}>取消</Button>
            <Button type="button" disabled={busy} onClick={() => void submitType()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCategoryCode)} onOpenChange={(open) => !open && setEditingCategoryCode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCategoryCode === "__new__" ? "新增材料分类" : "编辑材料分类"}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>编码</Label><Input disabled={editingCategoryCode !== "__new__"} value={categoryDraft.code} onChange={(e) => setCategoryDraft((p) => ({ ...p, code: e.target.value }))} />
            <Label>名称</Label><Input value={categoryDraft.name} onChange={(e) => setCategoryDraft((p) => ({ ...p, name: e.target.value }))} />
            <Label>父级分类（可选）</Label>
            <Select value={categoryDraft.parentCode || "__none__"} onValueChange={(v) => setCategoryDraft((p) => ({ ...p, parentCode: v === "__none__" ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="无父级" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">无父级</SelectItem>
                {categories
                  .filter((c) => c.code !== categoryDraft.code)
                  .map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Label>排序</Label><Input inputMode="numeric" value={categoryDraft.sortOrder} onChange={(e) => setCategoryDraft((p) => ({ ...p, sortOrder: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingCategoryCode(null)}>取消</Button>
            <Button type="button" disabled={busy} onClick={() => void submitCategory()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingTagCode)} onOpenChange={(open) => !open && setEditingTagCode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTagCode === "__new__" ? "新增风险提示" : "编辑风险提示"}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>编码</Label><Input disabled={editingTagCode !== "__new__"} value={tagDraft.code} onChange={(e) => setTagDraft((p) => ({ ...p, code: e.target.value }))} />
            <Label>名称</Label><Input value={tagDraft.name} onChange={(e) => setTagDraft((p) => ({ ...p, name: e.target.value }))} />
            <Label>风险等级</Label>
            <Select value={tagDraft.riskLevel} onValueChange={(v) => setTagDraft((p) => ({ ...p, riskLevel: v as RiskLevel }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无风险</SelectItem>
                <SelectItem value="low">低风险</SelectItem>
                <SelectItem value="medium">中风险</SelectItem>
                <SelectItem value="high">高风险</SelectItem>
              </SelectContent>
            </Select>
            <Label>排序</Label><Input inputMode="numeric" value={tagDraft.sortOrder} onChange={(e) => setTagDraft((p) => ({ ...p, sortOrder: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingTagCode(null)}>取消</Button>
            <Button type="button" disabled={busy} onClick={() => void submitTag()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

