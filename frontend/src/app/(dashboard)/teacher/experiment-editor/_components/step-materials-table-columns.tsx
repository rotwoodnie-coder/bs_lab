import { Badge, Button, DataTableColumnHeader, MediaPreview } from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";

import type { ExperimentMaterialDraft } from "../types";

export function buildStepMaterialsColumns(params: {
  disabled: boolean;
  materialsLength: number;
  onOpenEdit: (item: ExperimentMaterialDraft) => void;
  onRemove: (id: string) => void;
}): ColumnDef<ExperimentMaterialDraft>[] {
  return [
    {
      id: "thumbnail",
      accessorFn: (row) => row.thumbnailUrl || row.imageUrl || "",
      meta: { label: "缩略图" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="缩略图" />,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        const thumbnailSrc = item.thumbnailUrl || item.imageUrl || "";
        const displayName = item.nameLab?.trim() ? item.nameLab : "未命名材料";

        return (
          <div className="h-12 w-[84px] overflow-hidden rounded border border-border/60 bg-muted/30">
            {thumbnailSrc ? (
              <MediaPreview kind="image" src={thumbnailSrc} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">缩略图</div>
            )}
          </div>
        );
      },
    },
    {
      id: "name",
      accessorKey: "nameLab",
      meta: { label: "材料名称" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="材料名称" />,
      enableSorting: false,
      cell: ({ row }) => {
        const displayName = row.original.nameLab?.trim() ? row.original.nameLab : "未命名材料";
        return <span className="line-clamp-1 text-sm font-medium text-foreground">{displayName}</span>;
      },
    },
    {
      id: "hazards",
      accessorFn: (row) => (row.hazardFlags ?? []).join("、"),
      meta: { label: "危险属性" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="危险属性" />,
      enableSorting: false,
      cell: ({ row }) => {
        const hazards = row.original.hazardFlags ?? [];
        if (hazards.length === 0) return <span className="text-xs text-muted-foreground">无</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {hazards.map((hid) => (
              <Badge key={hid} variant="secondary" className="h-fit">
                {hid}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      meta: { label: "操作" },
      header: "操作",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" disabled={params.disabled} onClick={() => params.onOpenEdit(item)}>
              修改
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={params.disabled || params.materialsLength <= 1}
              onClick={() => params.onRemove(item.id)}
            >
              删除
            </Button>
          </div>
        );
      },
    },
  ];
}
