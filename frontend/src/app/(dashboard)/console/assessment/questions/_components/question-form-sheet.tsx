"use client";

import * as React from "react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  sonnerToast,
} from "@bs-lab/ui";
import { ChevronDown } from "@bs-lab/ui/icons";

import type { V2DictItem } from "@/lib/v2/v2-exp-api";
import type { CreateQuestionInput, UpdateQuestionInput, V2QuestionItem } from "@/lib/v2/v2-question-api";

import { QuestionFormSheetBody } from "./question-form-sheet-body";
import { emptyOptRows, nullIfEmpty, optRowsFromQuestion, undefinedIfEmpty, type OptRow } from "./question-form-utils";

function MetaRow(props: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border border-border px-3 py-2">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="break-all text-sm text-foreground">{props.value}</div>
    </div>
  );
}

export function QuestionFormSheet(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial: V2QuestionItem | null;
  questionTypes: V2DictItem[];
  difficultyTypes: V2DictItem[];
  questionCapacities: V2DictItem[];
  onSubmitCreate: (input: CreateQuestionInput) => Promise<void>;
  onSubmitUpdate: (questionId: string, patch: Omit<UpdateQuestionInput, "updaterId">) => Promise<void>;
}) {
  const { open, onOpenChange, mode, initial, questionTypes, difficultyTypes, questionCapacities } = props;
  const [saving, setSaving] = React.useState(false);
  const [metaOpen, setMetaOpen] = React.useState(false);

  const [questionContent, setQuestionContent] = React.useState("");
  const [questionTypeId, setQuestionTypeId] = React.useState("");
  const [difficultyTypeId, setDifficultyTypeId] = React.useState("");
  const [questionCapacityId, setQuestionCapacityId] = React.useState("");
  const [chooseType, setChooseType] = React.useState("");
  const [unitId, setUnitId] = React.useState("");
  const [knowledgeId, setKnowledgeId] = React.useState("");
  const [knowledgeContent, setKnowledgeContent] = React.useState("");
  const [teacherUserId, setTeacherUserId] = React.useState("");
  const [classId, setClassId] = React.useState("");
  const [opts, setOpts] = React.useState<OptRow[]>(emptyOptRows);

  React.useEffect(() => {
    if (!open) return;
    setMetaOpen(false);
    if (mode === "edit" && initial) {
      setQuestionContent(initial.questionContent);
      setQuestionTypeId(initial.questionTypeId ?? "");
      setDifficultyTypeId(initial.difficultyTypeId ?? "");
      setQuestionCapacityId(initial.questionCapacityId ?? "");
      setChooseType(initial.chooseType ?? "");
      setUnitId(initial.unitId ?? "");
      setKnowledgeId(initial.knowledgeId ?? "");
      setKnowledgeContent(initial.knowledgeContent ?? "");
      setTeacherUserId(initial.teacherUserId ?? "");
      setClassId(initial.classId ?? "");
      setOpts(optRowsFromQuestion(initial));
    } else if (mode === "create") {
      setQuestionContent("");
      setQuestionTypeId("");
      setDifficultyTypeId("");
      setQuestionCapacityId("");
      setChooseType("");
      setUnitId("");
      setKnowledgeId("");
      setKnowledgeContent("");
      setTeacherUserId("");
      setClassId("");
      setOpts(emptyOptRows());
    }
  }, [open, mode, initial]);

  const submit = async () => {
    const content = questionContent.trim();
    if (!content) return;
    setSaving(true);
    try {
      const selectsPayload = opts
        .map((o, i) => ({
          selectId: o.selectId,
          selectContent: o.selectContent.trim(),
          sortOrder: i,
          isRight: o.isRight,
        }))
        .filter((o) => o.selectContent.length > 0);

      if (mode === "create") {
        const input: CreateQuestionInput = {
          questionContent: content,
          questionTypeId: undefinedIfEmpty(questionTypeId),
          difficultyTypeId: undefinedIfEmpty(difficultyTypeId),
          questionCapacityId: undefinedIfEmpty(questionCapacityId),
          chooseType: undefinedIfEmpty(chooseType),
          unitId: undefinedIfEmpty(unitId),
          knowledgeId: undefinedIfEmpty(knowledgeId),
          knowledgeContent: undefinedIfEmpty(knowledgeContent),
          teacherUserId: undefinedIfEmpty(teacherUserId),
          classId: undefinedIfEmpty(classId),
          selects: selectsPayload.length > 0 ? selectsPayload : undefined,
        };
        await props.onSubmitCreate(input);
      } else if (initial) {
        const patch: Omit<UpdateQuestionInput, "updaterId"> = {
          questionContent: content,
          questionTypeId: nullIfEmpty(questionTypeId),
          difficultyTypeId: nullIfEmpty(difficultyTypeId),
          questionCapacityId: nullIfEmpty(questionCapacityId),
          chooseType: nullIfEmpty(chooseType),
          unitId: nullIfEmpty(unitId),
          knowledgeId: nullIfEmpty(knowledgeId),
          knowledgeContent: nullIfEmpty(knowledgeContent),
          teacherUserId: nullIfEmpty(teacherUserId),
          classId: nullIfEmpty(classId),
          selects: selectsPayload,
        };
        await props.onSubmitUpdate(initial.questionId, patch);
      }
      onOpenChange(false);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : mode === "create" ? "新建失败" : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-full flex-col gap-0 overflow-y-auto sm:max-w-lg md:max-w-none md:w-2/3"
      >
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "新建题目" : "编辑题目"}</SheetTitle>
          <SheetDescription>
            字段与表 <span className="font-mono text-xs">exp_question</span>、<span className="font-mono text-xs">exp_question_select</span>{" "}
            对齐；题型、难度、能力请从字典选择。
          </SheetDescription>
        </SheetHeader>
        {mode === "edit" && initial ? (
          <div className="pt-4">
            <Collapsible open={metaOpen} onOpenChange={setMetaOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/40">
                <span>系统与排障信息</span>
                <ChevronDown className={`size-4 shrink-0 transition-transform ${metaOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 grid gap-2 rounded-md border border-border bg-muted/10 p-3 sm:grid-cols-2">
                <MetaRow label="题目主键 ID" value={initial.questionId} />
                <MetaRow label="录入人" value={(initial.displayOwnerName ?? "").trim() || "—"} />
                <MetaRow label="创建时间" value={initial.createTime ?? "—"} />
                <MetaRow label="最后修改时间" value={initial.updateTime ?? "—"} />
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : null}
        <QuestionFormSheetBody
          questionContent={questionContent}
          onQuestionContent={setQuestionContent}
          questionTypeId={questionTypeId}
          onQuestionTypeId={setQuestionTypeId}
          difficultyTypeId={difficultyTypeId}
          onDifficultyTypeId={setDifficultyTypeId}
          questionCapacityId={questionCapacityId}
          onQuestionCapacityId={setQuestionCapacityId}
          chooseType={chooseType}
          onChooseType={setChooseType}
          unitId={unitId}
          onUnitId={setUnitId}
          knowledgeId={knowledgeId}
          onKnowledgeId={setKnowledgeId}
          knowledgeContent={knowledgeContent}
          onKnowledgeContent={setKnowledgeContent}
          teacherUserId={teacherUserId}
          onTeacherUserId={setTeacherUserId}
          classId={classId}
          onClassId={setClassId}
          questionTypes={questionTypes}
          difficultyTypes={difficultyTypes}
          questionCapacities={questionCapacities}
          opts={opts}
          onOptsChange={setOpts}
        />
        <SheetFooter className="gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={saving || !questionContent.trim()} onClick={() => void submit()}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
