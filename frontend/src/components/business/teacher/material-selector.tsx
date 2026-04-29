"use client";

import * as React from "react";
import {
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
} from "@bs-lab/ui";

import {
  getExperimentalMaterialSafetyLevel,
  type ExperimentalMaterialRecord,
} from "@/data/experimental-materials";
import { fetchExperimentalMaterials } from "@/lib/experimental-materials-api";
import type { ApiActor } from "@/lib/new-core-api";

export type ExperimentMaterialDraft = {
  id: string;
  name: string;
  hazard: "normal" | "warning" | "danger";
  substitute: string;
  imageUrl?: string;
};

type MaterialSelectorProps = {
  materials: ExperimentMaterialDraft[];
  disabled: boolean;
  onChange: (next: ExperimentMaterialDraft[]) => void;
  apiActor?: ApiActor;
};

const hazardLabelMap: Record<ExperimentMaterialDraft["hazard"], string> = {
  normal: "常规",
  warning: "注意安全",
  danger: "极度危险",
};

function toHazard(record: ExperimentalMaterialRecord): ExperimentMaterialDraft["hazard"] {
  return getExperimentalMaterialSafetyLevel(record);
}

export function MaterialSelector({ materials, disabled, onChange, apiActor }: MaterialSelectorProps) {
  const [keyword, setKeyword] = React.useState("");
  const [libraryRows, setLibraryRows] = React.useState<ExperimentalMaterialRecord[]>([]);
  const [loadingLibrary, setLoadingLibrary] = React.useState(false);

  React.useEffect(() => {
    if (!apiActor) return;
    let cancelled = false;
    setLoadingLibrary(true);
    fetchExperimentalMaterials(apiActor)
      .then((rows) => {
        if (!cancelled) setLibraryRows(rows);
      })
      .catch((error) => {
        if (!cancelled) {
          // Keep empty list and let upper-level form continue editing.
          // eslint-disable-next-line no-console
          console.warn("load material library failed", error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingLibrary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiActor]);

  const filteredLibrary = React.useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return libraryRows.slice(0, 6);
    return libraryRows
      .filter((row) => {
        const source = `${row.name} ${row.homeAlternative} ${row.usage} ${row.remark}`.toLowerCase();
        return source.includes(needle);
      })
      .slice(0, 6);
  }, [keyword, libraryRows]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="material-search">材料库搜索（支持图片关联）</Label>
        <Input
          id="material-search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="输入关键词，例如：盐酸、指示剂、玻璃棒"
          disabled={disabled || loadingLibrary}
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {filteredLibrary.map((record) => {
          const imageUrl = record.photoUrl;
          return (
            <Card key={record.id} className="border-0 shadow-sm">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{record.name || "未命名材料"}</p>
                  <Badge variant="secondary">{hazardLabelMap[toHazard(record)]}</Badge>
                </div>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={record.name || "material"}
                    className="h-24 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    暂无图片
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  onClick={() =>
                    onChange([
                      ...materials,
                      {
                        id: `m${Date.now()}`,
                        name: record.name,
                        substitute: record.homeAlternative,
                        hazard: toHazard(record),
                        imageUrl,
                      },
                    ])
                  }
                >
                  关联到本实验
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>已关联材料</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              onChange([...materials, { id: `m${Date.now()}`, name: "", hazard: "normal", substitute: "", imageUrl: "" }])
            }
          >
            新增材料
          </Button>
        </div>
        {materials.map((item, idx) => (
          <Card key={item.id} className="border-0 shadow-sm">
            <CardContent className="grid gap-2 pt-4 md:grid-cols-[2fr_1fr_2fr_auto]">
              <Input
                value={item.name}
                placeholder={`材料 ${idx + 1}`}
                disabled={disabled}
                onChange={(event) =>
                  onChange(materials.map((x) => (x.id === item.id ? { ...x, name: event.target.value } : x)))
                }
              />
              <Select
                value={item.hazard}
                disabled={disabled}
                onValueChange={(value) =>
                  onChange(
                    materials.map((x) =>
                      x.id === item.id ? { ...x, hazard: value as ExperimentMaterialDraft["hazard"] } : x,
                    ),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">常规</SelectItem>
                  <SelectItem value="warning">注意安全</SelectItem>
                  <SelectItem value="danger">极度危险</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={item.substitute}
                placeholder="家庭替代材料"
                disabled={disabled}
                onChange={(event) =>
                  onChange(materials.map((x) => (x.id === item.id ? { ...x, substitute: event.target.value } : x)))
                }
              />
              <Button
                type="button"
                variant="outline"
                disabled={disabled || materials.length <= 1}
                onClick={() => onChange(materials.filter((x) => x.id !== item.id))}
              >
                删除
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
