"use client";

let inMemoryFeed: DistrictFeedEntry[] = [];

export type DistrictFeedEntry = {
  id: string;
  kind: "DISTRICT_MODEL";
  title: string;
  snippet: string;
  schoolName: string;
  workId: string;
  createdAt: string;
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeDistrictSampleFeed(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function readAll(): DistrictFeedEntry[] {
  return [...inMemoryFeed];
}

function writeAll(items: DistrictFeedEntry[]) {
  inMemoryFeed = [...items];
  notify();
}

export function readDistrictSampleFeed(): DistrictFeedEntry[] {
  return readAll();
}

export function appendDistrictModelFeed(entry: Omit<DistrictFeedEntry, "kind" | "createdAt"> & { createdAt?: string }) {
  const row: DistrictFeedEntry = {
    ...entry,
    kind: "DISTRICT_MODEL",
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
  writeAll([row, ...readAll()]);
}
