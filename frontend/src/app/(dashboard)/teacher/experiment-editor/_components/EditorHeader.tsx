import * as React from "react";
import Link from "next/link";

import { Button } from "@bs-lab/ui";

export function EditorHeader(props: {
  creatorName: string;
  fallbackCreatorName: string;
  canShowNavSave: boolean;
  canShowNavSubmit: boolean;
  isTeacher: boolean;
  onSave: () => void;
  onSubmit: () => void;
}) {
  return (
    <header className="space-y-1">
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">实验编辑器</h1>
      <p className="text-sm text-muted-foreground">
        身份驱动：教师提交审核；教研员顶部审核；录入采用结构化表单与完整度检查。主区为分步标签，左侧为目录与总完成度。
      </p>
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
        <span>创建人</span>
        <span className="font-medium text-foreground">{props.creatorName || props.fallbackCreatorName}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        <Link href="/experiment-manage" className="text-primary underline-offset-4 hover:underline">
          返回实验课程管理
        </Link>
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {props.canShowNavSave ? (
          <Button type="button" variant="secondary" onClick={props.onSave}>
            保存
          </Button>
        ) : null}
        {props.canShowNavSubmit ? (
          <Button type="button" onClick={props.onSubmit}>
            发布
          </Button>
        ) : null}
        <Button type="button" variant="outline" asChild>
          <Link href="/experiment-manage">预览</Link>
        </Button>
        {props.isTeacher && !props.canShowNavSubmit ? (
          <p className="self-center text-xs text-muted-foreground">补齐必填项后可显示发布按钮。</p>
        ) : null}
      </div>
    </header>
  );
}

