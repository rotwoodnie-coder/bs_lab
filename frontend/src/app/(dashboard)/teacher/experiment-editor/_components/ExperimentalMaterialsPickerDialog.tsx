"use client";

import * as React from "react";

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, sonnerToast } from "@bs-lab/ui";
import { Search, X } from "lucide-react";

import { useDemoRole } from "@/components/layout/demo-role-context";
import type { ExperimentalMaterialRecord } from "@/data/experimental-materials";
import { getExperimentalMaterialSafetyLabels, getExperimentalMaterialTypeLabel } from "@/data/experimental-materials";
import { fetchExperimentalMaterials } from "@/lib/experimental-materials-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";

import { ExperimentalMaterialsCardsView } from "../../../experimental-materials/_components/ExperimentalMaterialsCardsView";
import { DEFAULT_FILTERS } from "../../../experimental-materials/page.constants";
import type { ExperimentalMaterialsFilters } from "../../../experimental-materials/page.types";

import type { ExperimentMaterialDraft } from "../types";

type Props = {
  disabled: boolean;
  className?: string;
  onAppendMaterials: (drafts: Omit<ExperimentMaterialDraft, "id">[]) => void;
};

export function ExperimentalMaterialsPickerDialog(props: Props) {
  const { role, orgId, hydrated } = useDemoRole();
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<ExperimentalMaterialRecord[]>([]);
  const [filters, setFilters] = React.useState<ExperimentalMaterialsFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = React.useState(false);

  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "editor-material-picker"), [orgId, role]);

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    fetchExperimentalMaterials(actor)
      .then((items) => {
        if (!cancelled) setRows(items);
      })
      .catch((error) => {
        if (!cancelled) sonnerToast.error(error instanceof Error ? error.message : "加载材料库失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, hydrated]);

  React.useEffect(() => {
    if (!props.disabled) return;
    setOpen(false);
  }, [props.disabled]);

  const mapRecordToDraft = React.useCallback(
    (record: ExperimentalMaterialRecord): Omit<ExperimentMaterialDraft, "id"> => {
      const hazardFlags = getExperimentalMaterialSafetyLabels(record.safetyTags);
      return {
        libraryMaterialId: record.id,
        thumbnailUrl: record.photoUrl,
        nameLab: record.name,
        quantity: record.suggestedAmount || "1",
        materialTypeId: record.materialType,
        materialType: getExperimentalMaterialTypeLabel(record.materialType),
        nameHomeSubstitute: record.homeAlternative,
        hazardFlags,
        safetyReminder: record.safetyNote || hazardFlags.join("、"),
        notes: record.remark || "",
      };
    },
    [],
  );

  const handlePick = React.useCallback(
    (record: ExperimentalMaterialRecord) => {
      props.onAppendMaterials([mapRecordToDraft(record)]);
      setOpen(false);
    },
    [mapRecordToDraft, props],
  );

  const triggerClassName = props.className ?? "min-w-[220px] flex-1";
  const filteredRows = React.useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      const source = `${row.name} ${row.usage} ${row.homeAlternative} ${row.remark}`.toLowerCase();
      return source.includes(query);
    });
  }, [filters.query, rows]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (props.disabled) return;
          setOpen(next);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>从材料库查找材料</DialogTitle>
          </DialogHeader>

          <div className="flex w-full items-center gap-2">
            <Input
              value={filters.query}
              onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              placeholder="搜索材料名称、用途、家庭替代材料"
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setFilters((prev) => ({ ...prev, query: "" }))}
              disabled={!filters.query.trim() || loading}
              aria-label="清空搜索"
            >
              {filters.query.trim() ? <X className="size-4" /> : <Search className="size-4" />}
            </Button>
          </div>

          <ExperimentalMaterialsCardsView
            mode="picker"
            rows={filteredRows}
            canMaintain={false}
            onToggleFavorite={() => undefined}
            onCopy={() => {}}
            onView={handlePick}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        variant="outline"
        className={triggerClassName}
        disabled={props.disabled}
        onClick={() => setOpen(true)}
      >
        从材料库查找材料
      </Button>
    </>
  );
}

