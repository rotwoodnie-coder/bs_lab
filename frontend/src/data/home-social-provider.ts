/**
 * 首页社交驾驶舱数据入口：已清理 Mock，等待真实 API 接入。
 * 当前所有列表与统计返回空/初始值，确保上线后无模拟痕迹。
 */
import type { Experiment } from "@/types/experiment";

import { MOCK_EXPERIMENTS } from "./mock-experiments";

export type HomeHotTag = { readonly id: string; readonly label: string; readonly href: string };

export type CommunityActivityItem = {
  readonly id: string;
  readonly name: string;
  readonly fallback: string;
  /** 已含「发布了」「评论了」等社交动作描述 */
  readonly action: string;
  readonly ago: string;
};

export type AchievementMedal = { readonly id: string; readonly label: string; readonly hint: string };

export function listPublishedExperiments(): Experiment[] {
  return MOCK_EXPERIMENTS.filter((e) => e.status === "published");
}

export function listHotExperimentsForCarousel(limit = 6): Experiment[] {
  return [];
}

export function listHomeHotTags(): readonly HomeHotTag[] {
  return [];
}

export function listCommunityActivities(): readonly CommunityActivityItem[] {
  return [];
}

export function listAchievementMedals(): readonly AchievementMedal[] {
  return [];
}

/** 顶栏 ⌘K 等：与实验并列检索的用户条目 */
export function listSearchableUsers() {
  return [];
}

export function listSearchableTopics() {
  return [];
}

export function getUserAchievementSummary(): {
  medalCount: number;
  scienceCredits: number;
  scienceLevelLabel: string;
} {
  return {
    medalCount: 0,
    scienceCredits: 0,
    scienceLevelLabel: "数据统计中",
  };
}
