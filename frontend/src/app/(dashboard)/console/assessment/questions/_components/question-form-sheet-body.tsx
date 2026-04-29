"use client";

import * as React from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@bs-lab/ui";
import { Plus, Trash2 } from "@bs-lab/ui/icons";

import type { V2DictItem } from "@/lib/v2/v2-exp-api";

import type { OptRow } from "./question-form-utils";

export function QuestionFormSheetBody(props: {
  questionContent: string;
  onQuestionContent: (v: string) => void;
  questionTypeId: string;
  onQuestionTypeId: (v: string) => void;
  difficultyTypeId: string;
  onDifficultyTypeId: (v: string) => void;
  questionCapacityId: string;
  onQuestionCapacityId: (v: string) => void;
  chooseType: string;
  onChooseType: (v: string) => void;
  unitId: string;
  onUnitId: (v: string) => void;
  knowledgeId: string;
  onKnowledgeId: (v: string) => void;
  knowledgeContent: string;
  onKnowledgeContent: (v: string) => void;
  teacherUserId: string;
  onTeacherUserId: (v: string) => void;
  classId: string;
  onClassId: (v: string) => void;
  questionTypes: V2DictItem[];
  difficultyTypes: V2DictItem[];
  questionCapacities: V2DictItem[];
  opts: OptRow[];
  onOptsChange: React.Dispatch<React.SetStateAction<OptRow[]>>;
}) {
  const p = props;
  const addOpt = () => p.onOptsChange((prev) => [...prev, { selectContent: "", isRight: "n" }]);
  const removeOpt = (idx: number) => p.onOptsChange((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  return (
    <div className="flex flex-1 flex-col gap-3 py-4">
      <div className="space-y-1">
        <Label htmlFor="q-content">题干内容</Label>
        <Textarea
          id="q-content"
          rows={5}
          value={p.questionContent}
          onChange={(e) => p.onQuestionContent(e.target.value)}
          placeholder="请输入题干（可与富文本存储格式一致）"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>题型</Label>
          <Select value={p.questionTypeId || "__none__"} onValueChange={(v) => p.onQuestionTypeId(v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="未选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">未选择</SelectItem>
              {p.questionTypes.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>难度类型</Label>
          <Select value={p.difficultyTypeId || "__none__"} onValueChange={(v) => p.onDifficultyTypeId(v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="未选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">未选择</SelectItem>
              {p.difficultyTypes.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>能力侧重点</Label>
        <Select value={p.questionCapacityId || "__none__"} onValueChange={(v) => p.onQuestionCapacityId(v === "__none__" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="未选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">未选择</SelectItem>
            {p.questionCapacities.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="q-choose">选择类型</Label>
          <Select value={p.chooseType || "__none__"} onValueChange={(v) => p.onChooseType(v === "__none__" ? "" : v)}>
            <SelectTrigger id="q-choose">
              <SelectValue placeholder="未选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">未选择</SelectItem>
              <SelectItem value="S">单选</SelectItem>
              <SelectItem value="M">多选</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="q-unit">教材节 ID</Label>
          <Input id="q-unit" value={p.unitId} onChange={(e) => p.onUnitId(e.target.value)} placeholder="可选，对应 unit_id" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="q-kid">知识点 ID</Label>
          <Input id="q-kid" value={p.knowledgeId} onChange={(e) => p.onKnowledgeId(e.target.value)} placeholder="可选" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="q-kc">知识点说明</Label>
          <Input id="q-kc" value={p.knowledgeContent} onChange={(e) => p.onKnowledgeContent(e.target.value)} placeholder="可选" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="q-teacher">教师用户 ID</Label>
          <Input id="q-teacher" value={p.teacherUserId} onChange={(e) => p.onTeacherUserId(e.target.value)} placeholder="可选" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="q-class">班级组织 ID</Label>
          <Input id="q-class" value={p.classId} onChange={(e) => p.onClassId(e.target.value)} placeholder="可选" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>选项</Label>
          <Button type="button" size="sm" variant="outline" onClick={addOpt}>
            <Plus className="size-3.5" />
            添加选项
          </Button>
        </div>
        <div className="space-y-2 rounded-md border border-border p-2">
          {p.opts.map((row, idx) => (
            <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">选项 {idx + 1}</span>
                <Input
                  value={row.selectContent}
                  onChange={(e) =>
                    p.onOptsChange((prev) => prev.map((item, i) => (i === idx ? { ...item, selectContent: e.target.value } : item)))
                  }
                  placeholder="选项内容"
                />
              </div>
              <div className="flex w-full shrink-0 gap-2 sm:w-40">
                <Select
                  value={row.isRight}
                  onValueChange={(v) =>
                    p.onOptsChange((prev) => prev.map((item, i) => (i === idx ? { ...item, isRight: v as "y" | "n" } : item)))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="n">非正确项</SelectItem>
                    <SelectItem value="y">正确项</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeOpt(idx)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
