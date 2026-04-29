"use client";

type DropEntry = {
  isFile: boolean;
  isDirectory: boolean;
  file?: (callback: (file: File) => void) => void;
  createReader?: () => { readEntries: (cb: (entries: DropEntry[]) => void) => void };
};

function toDropEntry(item: DataTransferItem): DropEntry | null {
  const maybe = item as DataTransferItem & { webkitGetAsEntry?: () => DropEntry | null };
  if (typeof maybe.webkitGetAsEntry !== "function") return null;
  return maybe.webkitGetAsEntry();
}

async function readAllDirectoryEntries(reader: { readEntries: (cb: (entries: DropEntry[]) => void) => void }): Promise<DropEntry[]> {
  const out: DropEntry[] = [];
  for (;;) {
    const entries = await new Promise<DropEntry[]>((resolve) => reader.readEntries((value) => resolve(value ?? [])));
    if (entries.length === 0) break;
    out.push(...entries);
  }
  return out;
}

async function readFileFromEntry(entry: DropEntry): Promise<File | null> {
  if (!entry.isFile || typeof entry.file !== "function") return null;
  return new Promise<File | null>((resolve) => {
    try {
      entry.file!((file) => resolve(file ?? null));
    } catch {
      resolve(null);
    }
  });
}

async function walkEntry(entry: DropEntry, out: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await readFileFromEntry(entry);
    if (file) out.push(file);
    return;
  }
  if (!entry.isDirectory || typeof entry.createReader !== "function") return;
  const reader = entry.createReader();
  const children = await readAllDirectoryEntries(reader);
  for (const child of children) {
    await walkEntry(child, out);
  }
}

export async function collectFilesFromDrop(dataTransfer: DataTransfer): Promise<File[]> {
  const itemList = Array.from(dataTransfer.items ?? []);
  const entries = itemList
    .filter((item) => item.kind === "file")
    .map(toDropEntry)
    .filter((entry): entry is DropEntry => Boolean(entry));
  if (entries.length > 0) {
    const files: File[] = [];
    for (const entry of entries) {
      await walkEntry(entry, files);
    }
    if (files.length > 0) return files;
  }
  return Array.from(dataTransfer.files ?? []);
}
