import * as React from "react";
import { Badge, Button, Card, CardContent, Checkbox, DataTable, DataTablePagination, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Label, MediaPreview } from "@bs-lab/ui";
import { LayoutGrid, LayoutList, MoreHorizontal } from "@bs-lab/ui/icons";
import { getCoreRowModel, getPaginationRowModel, useReactTable } from "@bs-lab/ui/react-table";
import type { ExperimentMaterialDraft } from "../types";
import { StepExperimentalMaterialFormDialog } from "./StepExperimentalMaterialFormDialog";
import { StepMaterialsBulkInput } from "./StepMaterialsBulkInput";
import { StepMaterialsLibraryPanel } from "./StepMaterialsLibraryPanel";
import { buildStepMaterialsColumns } from "./step-materials-table-columns";

type MaterialViewMode = "list" | "card";

type Props = {
  materials: ExperimentMaterialDraft[];
  disabled: boolean;
  onAppendMaterials: (drafts: Omit<ExperimentMaterialDraft, "id">[]) => void;
  onRemoveMaterial: (id: string) => void;
  onUpdateMaterial: (
    id: string,
    field:
      | "nameLab"
      | "nameHomeSubstitute"
      | "hazardFlags"
      | "notes"
      | "quantity"
      | "materialType"
      | "safetyReminder"
      | "thumbnailUrl"
      | "libraryMaterialId",
    value: string | string[],
  ) => void;
};

export function StepMaterialsPanel(props: Props) {
  const [viewMode, setViewMode] = React.useState<MaterialViewMode>("list");
  const [syncToLibrary, setSyncToLibrary] = React.useState(true);
  const [materialDialogOpen, setMaterialDialogOpen] = React.useState(false);
  const [materialDialogMode, setMaterialDialogMode] = React.useState<"create" | "edit">("create");
  const [materialDialogInitialDraft, setMaterialDialogInitialDraft] = React.useState<ExperimentMaterialDraft | null>(null);
  const [editingMaterialId, setEditingMaterialId] = React.useState<string | null>(null);

  const openEditDialog = React.useCallback((item: ExperimentMaterialDraft) => {
    setMaterialDialogMode("edit");
    setEditingMaterialId(item.id);
    setMaterialDialogInitialDraft(item);
    setMaterialDialogOpen(true);
  }, []);

  const handleDialogSave = React.useCallback(
    (draft: Omit<ExperimentMaterialDraft, "id">) => {
      if (materialDialogMode === "create") {
        props.onAppendMaterials([draft]);
        return;
      }
      if (!editingMaterialId) return;
      props.onUpdateMaterial(editingMaterialId, "thumbnailUrl", draft.thumbnailUrl ?? "");
      props.onUpdateMaterial(editingMaterialId, "nameLab", draft.nameLab);
      props.onUpdateMaterial(editingMaterialId, "quantity", draft.quantity ?? "1");
      props.onUpdateMaterial(editingMaterialId, "materialType", draft.materialType ?? "实验材料");
      props.onUpdateMaterial(editingMaterialId, "nameHomeSubstitute", draft.nameHomeSubstitute);
      props.onUpdateMaterial(editingMaterialId, "hazardFlags", draft.hazardFlags);
      props.onUpdateMaterial(editingMaterialId, "safetyReminder", draft.safetyReminder ?? "");
      props.onUpdateMaterial(editingMaterialId, "notes", draft.notes);
      if (draft.libraryMaterialId) {
        props.onUpdateMaterial(editingMaterialId, "libraryMaterialId", draft.libraryMaterialId);
      }
    },
    [editingMaterialId, materialDialogMode, props],
  );

  const columns = React.useMemo(
    () =>
      buildStepMaterialsColumns({
        disabled: props.disabled,
        materialsLength: props.materials.length,
        onOpenEdit: openEditDialog,
        onRemove: props.onRemoveMaterial,
      }),
    [openEditDialog, props.disabled, props.materials.length, props.onRemoveMaterial],
  );

  const materialsTable = useReactTable({
    data: props.materials,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <div className="grid gap-3">
      <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardContent className="grid gap-3 pt-4">
          <StepMaterialsBulkInput disabled={props.disabled} onAppendMaterials={props.onAppendMaterials} />

          <div className="flex flex-wrap items-center gap-2">
            <Label>本次实验材料</Label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={syncToLibrary}
                onCheckedChange={(checked) => setSyncToLibrary(Boolean(checked))}
                disabled={props.disabled}
              />
              保存时同步到实验材料库
            </label>
            <StepMaterialsLibraryPanel
              disabled={props.disabled}
              onAppendMaterials={props.onAppendMaterials}
              className="min-w-[220px] flex-1"
            />
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={props.disabled}
                aria-label="切换列表/卡片"
                onClick={() => setViewMode((v) => (v === "list" ? "card" : "list"))}
              >
                {viewMode === "list" ? (
                  <LayoutList className="h-4 w-4" aria-hidden />
                ) : (
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={props.disabled}
                onClick={() => {
                  setMaterialDialogMode("create");
                  setEditingMaterialId(null);
                  setMaterialDialogInitialDraft(null);
                  setMaterialDialogOpen(true);
                }}
              >
                新增材料
              </Button>
            </div>
          </div>

          {viewMode === "card" ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {props.materials.map((item, idx) => (
                <Card key={item.id} className="border border-border bg-muted/10 shadow-none">
                  <CardContent className="grid gap-2 p-2.5">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-muted/30">
                      {item.thumbnailUrl || item.imageUrl ? (
                        <MediaPreview
                          kind="image"
                          src={item.thumbnailUrl || item.imageUrl || ""}
                          alt={item.nameLab || `材料${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          缩略图
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="line-clamp-1 text-sm font-semibold text-foreground">{item.nameLab || `材料 ${idx + 1}`}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="h-fit px-1.5 py-0 text-[11px] font-normal">
                            {item.materialType || "实验材料"}
                          </Badge>
                          <Badge variant="secondary" className="h-fit px-1.5 py-0 text-[11px] font-normal">
                            {item.quantity || "1"}
                          </Badge>
                          {(item.hazardFlags ?? []).slice(0, 1).map((hid) => (
                            <Badge key={hid} variant="secondary" className="h-fit px-1.5 py-0 text-[11px] font-normal">
                              {hid}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            disabled={props.disabled}
                            aria-label={`操作${item.nameLab || `材料 ${idx + 1}`}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-24">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>修改</DropdownMenuItem>
                          <DropdownMenuItem disabled={props.materials.length <= 1} onClick={() => props.onRemoveMaterial(item.id)}>
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="line-clamp-1 text-xs text-muted-foreground">{item.safetyReminder || "未填写安全提醒"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <DataTable
                table={materialsTable}
                stickyHeader
                showRowNumber
                rowNumberHeader="序号"
                emptyText="暂无材料条目。"
                className="max-h-[52vh] overflow-auto"
              />
              <DataTablePagination table={materialsTable} pageSizeOptions={[5, 8, 10]} />
            </div>
          )}

        </CardContent>
      </Card>
      <StepExperimentalMaterialFormDialog
        open={materialDialogOpen}
        mode={materialDialogMode}
        initialDraft={materialDialogInitialDraft}
        disabled={props.disabled}
        syncToLibrary={syncToLibrary}
        onOpenChange={(open) => {
          setMaterialDialogOpen(open);
          if (!open) {
            setEditingMaterialId(null);
            setMaterialDialogInitialDraft(null);
          }
        }}
        onSave={handleDialogSave}
      />
    </div>
  );
}
