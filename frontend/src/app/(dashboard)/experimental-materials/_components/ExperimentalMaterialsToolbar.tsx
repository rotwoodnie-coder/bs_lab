"use client";

import * as React from "react";
import {
  Checkbox,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";

import { DEFAULT_FILTERS, MATERIAL_CATEGORY_OPTIONS, materialRiskLevelFilterItems, materialTypeFilterItems } from "../page.constants";
import type { ExperimentalMaterialsFilters } from "../page.types";
import { Plus, Search } from "@bs-lab/ui/icons";

export function ExperimentalMaterialsToolbar(props: {
  filters: ExperimentalMaterialsFilters;
  onFiltersChange: (updater: (prev: ExperimentalMaterialsFilters) => ExperimentalMaterialsFilters) => void;
  canMaintain: boolean;
  onCreate: () => void;
  /** 材料库维护者可打开规则管理（大 Sheet） */
  onOpenRulesManagement?: () => void;
  /** 维表驱动的材料类型筛选项（display_name）；缺省时回退到本地常量 */
  dimensionTypeItems?: { id: string; label: string }[] | null;
  /** 维表驱动的分类筛选项（含学科与类目树缩进）；缺省时回退到本地常量 */
  dimensionCategoryItems?: { id: string; label: string }[] | null;
}) {
  const typeFilterRows =
    props.dimensionTypeItems && props.dimensionTypeItems.length > 0
      ? [{ id: "all", label: "全部分类" }, ...props.dimensionTypeItems]
      : materialTypeFilterItems();
  const categoryRows =
    props.dimensionCategoryItems && props.dimensionCategoryItems.length > 0
      ? props.dimensionCategoryItems
      : MATERIAL_CATEGORY_OPTIONS;

  function multiSelectLabel(value: readonly string[], placeholder: string, options: { id: string; label: string }[]) {
    if (value.length === 0) return placeholder;
    const labels = value.map((id) => options.find((o) => o.id === id)?.label ?? id);
    return labels.join("、");
  }

  return (
    <Card className="rounded-xl border border-border shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">实验材料筛选</h2>
            <p className="text-sm text-muted-foreground">按材料名称、分类、属性与安全风险筛选实验材料。</p>
          </div>
          {props.canMaintain ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {props.onOpenRulesManagement ? (
                <Button type="button" size="sm" variant="outline" className="rounded-md" onClick={props.onOpenRulesManagement}>
                  规则管理
                </Button>
              ) : null}
              <Button type="button" size="sm" className="rounded-md gap-1.5" onClick={props.onCreate}>
                <Plus className="size-4" aria-hidden />
                新增材料
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={props.filters.query}
                onChange={(event) => props.onFiltersChange((prev) => ({ ...prev, query: event.target.value }))}
                placeholder="搜索材料名称、用途"
                className="h-10 rounded-md pl-9"
              />
            </div>
          </div>

          <Select
            value={props.filters.materialType}
            onValueChange={(value) => props.onFiltersChange((prev) => ({ ...prev, materialType: value as ExperimentalMaterialsFilters["materialType"] }))}
          >
            <SelectTrigger className="h-10 w-full rounded-md text-sm">
              <SelectValue placeholder="材料分类" />
            </SelectTrigger>
            <SelectContent>
              {typeFilterRows.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-10 w-full justify-between rounded-md px-3 text-sm">
                <span className="truncate">{multiSelectLabel(props.filters.category, "全部属性", categoryRows)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>材料属性</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={props.filters.category.length === 0}
                onCheckedChange={(checked) => {
                  if (!checked) return;
                  props.onFiltersChange((prev) => ({ ...prev, category: [] }));
                }}
                onSelect={(e) => e.preventDefault()}
              >
                全部
              </DropdownMenuCheckboxItem>
              {categoryRows.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.id}
                  checked={props.filters.category.includes(opt.id)}
                  onCheckedChange={(checked) => {
                    props.onFiltersChange((prev) => {
                      const current = prev.category;
                      const next = checked ? [...new Set([...current, opt.id])] : current.filter((v) => v !== opt.id);
                      return { ...prev, category: next };
                    });
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select
            value={props.filters.riskLevel}
            onValueChange={(value) => props.onFiltersChange((prev) => ({ ...prev, riskLevel: value as ExperimentalMaterialsFilters["riskLevel"] }))}
          >
            <SelectTrigger className="h-10 w-full rounded-md text-sm">
              <SelectValue placeholder="安全风险" />
            </SelectTrigger>
            <SelectContent>
              {materialRiskLevelFilterItems().map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end sm:col-span-2 lg:col-span-1">
            <Button type="button" variant="outline" size="sm" className="h-10 w-full rounded-md" onClick={() => props.onFiltersChange(() => DEFAULT_FILTERS)}>
              清空筛选
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
            <Checkbox
              checked={props.filters.onlyFavorites}
              onCheckedChange={(checked) => props.onFiltersChange((prev) => ({ ...prev, onlyFavorites: Boolean(checked) }))}
            />
            <span className="text-sm text-foreground">仅显示收藏</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
