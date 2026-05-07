import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle, type RichMediaValue } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import type { V2DictItem } from "@/lib/v2/v2-exp-api";
import { plainTextFromHtml } from "@/components/business/rich-html-editor/word-html-sanitize";

import { EXPERIMENT_EDITOR_MULTILINE_ROWS } from "../../page.constants";
import type { ExperimentReferenceCitationDraft, ExperimentResultEntryDraft, ExperimentScientistStoryDraft, ExperimentSecurityDraft } from "../../types";
import { EditorExperimentReferencePanel } from "./EditorExperimentReferencePanel";
import { EditorScientistStoryPanel } from "./EditorScientistStoryPanel";
import { ResultEntryList } from "../ResultEntryList";
import { SafetyPresetChips } from "../SafetyPresetChips";
import { SafetyTagSelector } from "../SafetyTagSelector";
import { StepContentRichEditor } from "../StepContentRichEditor";

export function EditorTailSections(props: {
  fieldDisabled: boolean;
  mediaActor: ApiActor;
  userId?: string;
  securities: V2DictItem[];
  resultEntries: ExperimentResultEntryDraft[];
  addResultEntry: () => void;
  removeResultEntry: (id: string) => void;
  updateResultEntryTitle: (id: string, value: string) => void;
  updateResultRichContent: (id: string, next: RichMediaValue) => void;
  reorderResultEntry: (fromIndex: number, toIndex: number) => void;
  safetyNotes: string;
  safetyEmbeds: import("@bs-lab/ui").RichMediaEmbed[];
  onSafetyRichChange: (next: RichMediaValue) => void;
  dangerNotes: string;
  dangerEmbeds: import("@bs-lab/ui").RichMediaEmbed[];
  onDangerRichChange: (next: RichMediaValue) => void;
  safetyDrafts: ExperimentSecurityDraft[];
  onToggleSafetyTag: (securityId: string) => void;
  referenceCitations: ExperimentReferenceCitationDraft[];
  addReferenceCitation: () => void;
  removeReferenceCitation: (id: string) => void;
  updateReferenceCitation: (
    id: string,
    field: keyof Pick<ExperimentReferenceCitationDraft, "citedExperimentTitle" | "sourceOrLink" | "note">,
    value: string,
  ) => void;
  referenceVideo: string;
  setReferenceVideo: (v: string) => void;
  referenceVideos: Array<{ videoUrl: string; sortOrder?: number }>;
  addReferenceVideo: () => void;
  removeReferenceVideo: (id: number) => void;
  setReferenceVideos: (v: Array<{ videoUrl: string; sortOrder?: number }>) => void;
  referenceRichText: string;
  referenceRichEmbeds: import("@bs-lab/ui").RichMediaEmbed[];
  onReferenceRichChange: (next: RichMediaValue) => void;
  scientistStories: ExperimentScientistStoryDraft[];
  addScientistStory: () => void;
  removeScientistStory: (id: string) => void;
  updateScientistStory: (id: string, field: keyof Omit<ExperimentScientistStoryDraft, "id">, value: string) => void;
  visibleSections?: Array<"result" | "safety" | "experimentReference" | "scientistStory">;
}) {
  const visibleSet = React.useMemo(
    () => new Set(props.visibleSections ?? ["result", "safety", "experimentReference", "scientistStory"]),
    [props.visibleSections],
  );

  return (
    <>
      {visibleSet.has("result") ? (
        <Card id="result" className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-base">实验结果</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ResultEntryList
              mediaActor={props.mediaActor}
              entries={props.resultEntries}
              disabled={props.fieldDisabled}
              onAdd={props.addResultEntry}
              onRemove={props.removeResultEntry}
              onUpdateTitle={props.updateResultEntryTitle}
              onRichContentChange={props.updateResultRichContent}
              onReorder={props.reorderResultEntry}
            />
          </CardContent>
        </Card>
      ) : null}

      {visibleSet.has("safety") ? (
        <Card id="safety" className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-base">安全提示</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {props.safetyDrafts.length > 0 ? (
              <SafetyTagSelector
                drafts={props.safetyDrafts}
                onToggle={props.onToggleSafetyTag}
                disabled={props.fieldDisabled}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
            <div>
              <StepContentRichEditor
                mediaActor={props.mediaActor}
                disabled={props.fieldDisabled}
                content={props.safetyNotes}
                contentEmbeds={props.safetyEmbeds}
                onChange={props.onSafetyRichChange}
                editorTitle="安全注意事项"
                contentPlaceholder="请填写安全注意事项。"
                textRows={EXPERIMENT_EDITOR_MULTILINE_ROWS}
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {plainTextFromHtml(props.safetyNotes).length}/200 字符
                </span>
                {plainTextFromHtml(props.safetyNotes).length > 180 && (
                  <span className="text-xs text-amber-500">
                    即将达到上限，超出部分不会被保存
                  </span>
                )}
              </div>
              {props.securities.length > 0 ? (
                <div className="mt-2">
                  <SafetyPresetChips
                    securities={props.securities}
                    currentText={plainTextFromHtml(props.safetyNotes)}
                    onChange={(next) =>
                      props.onSafetyRichChange({
                        text: next,
                        embeds: props.safetyEmbeds,
                      })
                    }
                    disabled={props.fieldDisabled}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <StepContentRichEditor
                mediaActor={props.mediaActor}
                disabled={props.fieldDisabled}
                content={props.dangerNotes}
                contentEmbeds={props.dangerEmbeds}
                onChange={props.onDangerRichChange}
                editorTitle="危险提示"
                contentPlaceholder="请填写危险提示。"
                textRows={EXPERIMENT_EDITOR_MULTILINE_ROWS}
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {plainTextFromHtml(props.dangerNotes).length}/200 字符
                </span>
                {plainTextFromHtml(props.dangerNotes).length > 180 && (
                  <span className="text-xs text-amber-500">
                    即将达到上限，超出部分不会被保存
                  </span>
                )}
              </div>
              {props.securities.length > 0 ? (
                <div className="mt-2">
                  <SafetyPresetChips
                    securities={props.securities}
                    currentText={plainTextFromHtml(props.dangerNotes)}
                    onChange={(next) =>
                      props.onDangerRichChange({
                        text: next,
                        embeds: props.dangerEmbeds,
                      })
                    }
                    disabled={props.fieldDisabled}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
        </Card>
      ) : null}

      {visibleSet.has("experimentReference") ? (
        <EditorExperimentReferencePanel
          fieldDisabled={props.fieldDisabled}
          mediaActor={props.mediaActor}
          referenceCitations={props.referenceCitations}
          addReferenceCitation={props.addReferenceCitation}
          removeReferenceCitation={props.removeReferenceCitation}
          updateReferenceCitation={props.updateReferenceCitation}
          referenceVideo={props.referenceVideo}
          setReferenceVideo={props.setReferenceVideo}
          referenceVideos={props.referenceVideos}
          addReferenceVideo={props.addReferenceVideo}
          removeReferenceVideo={props.removeReferenceVideo}
          setReferenceVideos={props.setReferenceVideos}
          referenceRichText={props.referenceRichText}
          referenceRichEmbeds={props.referenceRichEmbeds}
          onReferenceRichChange={props.onReferenceRichChange}
        />
      ) : null}

      {visibleSet.has("scientistStory") ? (
        <EditorScientistStoryPanel
          fieldDisabled={props.fieldDisabled}
          mediaActor={props.mediaActor}
          scientistStories={props.scientistStories}
          addScientistStory={props.addScientistStory}
          removeScientistStory={props.removeScientistStory}
          updateScientistStory={props.updateScientistStory}
        />
      ) : null}
    </>
  );
}
