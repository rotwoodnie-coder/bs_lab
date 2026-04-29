"use client";

import { Button, Input } from "@bs-lab/ui";

export function ExperimentCatalogToolbar(props: {
  keyword: string;
  setKeyword: (v: string) => void;
  saving: boolean;
  canManage: boolean;
  onRefresh: () => void;
  /** 回车提交搜索（与「刷新列表」区分：先按草稿提交关键词，必要时再拉取）。 */
  onSearchSubmit: () => void;
  onOpenNewCore: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0 flex-1">
        <Input
          value={props.keyword}
          onChange={(e) => props.setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              props.onSearchSubmit();
            }
          }}
          placeholder="搜索实验名称或编码（回车提交）"
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {props.saving ? <span className="text-xs text-muted-foreground">加载中...</span> : null}
        <Button type="button" variant="secondary" onClick={() => void props.onRefresh()}>
          刷新列表
        </Button>
        {props.canManage ? (
          <Button type="button" onClick={props.onOpenNewCore}>
            新增实验列表
          </Button>
        ) : null}
      </div>
    </div>
  );
}
