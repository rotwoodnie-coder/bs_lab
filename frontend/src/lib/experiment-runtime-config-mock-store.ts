"use client";

import * as React from "react";

/**
 * 闭环 C：按实验 ID 下发的运行时配置（安全提示、材料平替），Mock 存 localStorage；
 * 教师任务中心可订阅同一键实现「准实时」同步。
 */
let inMemoryConfigs: Record<string, ExperimentRuntimeConfig> = {};

export type ExperimentRuntimeConfig = {
  experimentId: string;
  safetyHint?: string;
  materialSubstituteHint?: string;
  updatedAt: string;
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeExperimentRuntimeConfig(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function readAll(): Record<string, ExperimentRuntimeConfig> {
  return { ...inMemoryConfigs };
}

function writeAll(next: Record<string, ExperimentRuntimeConfig>) {
  inMemoryConfigs = { ...next };
  notify();
}

export function getExperimentRuntimeConfig(experimentId: string): ExperimentRuntimeConfig | undefined {
  return readAll()[experimentId];
}

export function upsertExperimentRuntimeConfig(
  experimentId: string,
  patch: Partial<Pick<ExperimentRuntimeConfig, "safetyHint" | "materialSubstituteHint">>,
): ExperimentRuntimeConfig {
  const all = readAll();
  const prev = all[experimentId];
  const next: ExperimentRuntimeConfig = {
    experimentId,
    safetyHint: patch.safetyHint ?? prev?.safetyHint,
    materialSubstituteHint: patch.materialSubstituteHint ?? prev?.materialSubstituteHint,
    updatedAt: new Date().toISOString(),
  };
  writeAll({ ...all, [experimentId]: next });
  return next;
}

export function useExperimentRuntimeConfig(experimentId: string | null | undefined) {
  const [cfg, setCfg] = React.useState<ExperimentRuntimeConfig | undefined>(() =>
    experimentId ? getExperimentRuntimeConfig(experimentId) : undefined,
  );

  React.useEffect(() => {
    if (!experimentId) {
      setCfg(undefined);
      return;
    }
    setCfg(getExperimentRuntimeConfig(experimentId));
    return subscribeExperimentRuntimeConfig(() => {
      setCfg(getExperimentRuntimeConfig(experimentId));
    });
  }, [experimentId]);

  return cfg;
}
