"use client";

import { Button, Input } from "@bs-lab/ui";
import { Plus, Search, Table2 } from "@bs-lab/ui/icons";

export function TeacherMaterialsToolbar(props: {
  keyword: string;
  onKeywordChange: (value: string) => void;
  onCreateClick: () => void;
  /** 展开「data_file 全列」检视（排障） */
  dbInspectorOpen?: boolean;
  onDbInspectorToggle?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={props.keyword}
          onChange={(e) => props.onKeywordChange(e.target.value)}
          placeholder="搜索标题、文件名或关联实验"
          className="pl-9"
          aria-label="搜索素材"
        />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {props.onDbInspectorToggle ? (
          <Button
            type="button"
            size="sm"
            variant={props.dbInspectorOpen ? "secondary" : "outline"}
            onClick={props.onDbInspectorToggle}
          >
            <Table2 className="size-4" />
            {props.dbInspectorOpen ? "隐藏库表检视" : "库表字段检视"}
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={props.onCreateClick}>
          <Plus className="size-4" />
          新建素材
        </Button>
      </div>
    </div>
  );
}
