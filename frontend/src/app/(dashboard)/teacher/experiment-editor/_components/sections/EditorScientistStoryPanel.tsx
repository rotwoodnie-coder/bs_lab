"use client";

import * as React from "react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";
import { RichHtmlEditor } from "@bs-lab/ui";
import { plainTextFromHtml } from "@/components/business/rich-html-editor/word-html-sanitize";
import type { ExperimentScientistStoryDraft } from "../../types";

export function EditorScientistStoryPanel(props: {
  fieldDisabled: boolean;
  mediaActor?: ApiActor;
  scientistStories: ExperimentScientistStoryDraft[];
  addScientistStory: () => void;
  removeScientistStory: (id: string) => void;
  updateScientistStory: (id: string, field: keyof Omit<ExperimentScientistStoryDraft, "id">, value: string) => void;
}) {
  return (
    <div id="scientistStory" className="scroll-mt-24">
      <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="text-base">中国科学家故事</CardTitle>
          <CardDescription>填写与本实验主题相关的科学家事迹，用于课堂拓展与科学精神教育。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">建议补充人物、事件和与本实验的关联。</p>
            <Button type="button" variant="secondary" size="sm" onClick={props.addScientistStory} disabled={props.fieldDisabled}>
              新增故事
            </Button>
          </div>
          {props.scientistStories.length === 0 ? null : (
            <ul className="grid gap-4">
              {props.scientistStories.map((row, index) => (
                <li key={row.id} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">故事 {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => props.removeScientistStory(row.id)}
                      disabled={props.fieldDisabled}
                    >
                      删除本条
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`sci-name-${row.id}`}>科学家姓名</Label>
                      <Input
                        id={`sci-name-${row.id}`}
                        value={row.scientistName}
                        onChange={(e) => props.updateScientistStory(row.id, "scientistName", e.target.value)}
                        disabled={props.fieldDisabled}
                        placeholder="例如：钱学森"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`sci-title-${row.id}`}>故事名称</Label>
                      <Input
                        id={`sci-title-${row.id}`}
                        value={row.storyName}
                        onChange={(e) => props.updateScientistStory(row.id, "storyName", e.target.value)}
                        disabled={props.fieldDisabled}
                        placeholder="例如：两弹一星精神的启示"
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label>故事正文（富文本）</Label>
                      {props.mediaActor ? (
                        <RichHtmlEditor
                          value={row.storyComments}
                          onChange={(html) => props.updateScientistStory(row.id, "storyComments", html)}
                          disabled={props.fieldDisabled}
                          title={`故事正文 · 故事 ${index + 1}`}
                          placeholder="请输入故事正文"
                          onUploadImage={async (file) => {
                            const result = await uploadMediaFileToPlatform(props.mediaActor!, file, { kind: "image", title: file.name });
                            return result?.viewUrl?.trim() ? { src: result.viewUrl } : null;
                          }}
                        />
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {plainTextFromHtml(row.storyComments).length}/200 字符
                        </span>
                        {plainTextFromHtml(row.storyComments).length > 180 && (
                          <span className="text-xs text-amber-500">
                            即将达到上限，超出部分不会被保存
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
