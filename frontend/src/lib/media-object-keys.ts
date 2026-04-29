export function createRawVideoObjectKey(filename: string) {
  const safeName = filename.replaceAll(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `raw/${yyyy}-${mm}-${dd}/${id}/${safeName || "upload.bin"}`;
}

