import type { EditorPeerRow } from "@/app/(dashboard)/teacher/experiment-editor/utils/editor-peer-row-types";
import type { ApiActor } from "@/lib/new-core-api";

export type ExperimentManageCardRow = EditorPeerRow;

export type ExperimentManageCardMenuAction =
  | "edit"
  | "review_or_view"
  | "video_manage"
  | "like"
  | "favorite"
  | "comment"
  | "same_style"
  | "delete";

export type ExperimentManageCardQuickState = {
  liked: boolean;
  likeCount: number;
  favorited: boolean;
  commentCount: number;
};

export type ExperimentManageCardContext = {
  actor: ApiActor;
  row: ExperimentManageCardRow;
  defaultVideoId?: string;
};

