/**
 * 补齐 `data_file.content_sha256` / `file_type_id`（仅空值写入，防篡改）。
 */
import { createHash } from "node:crypto";
import {
  getFileById,
  repairDataFileEmptyMetadataFields,
  resolveDataFileTypeIdByTeacherMaterialKind,
} from "../../infrastructure/repositories/v2-file-repository.ts";
import { getDirectUrl, getObjectBuffer } from "../../infrastructure/storage/s3-storage.ts";
import { inferTeacherMaterialKindFromDataFile } from "./v2-file-extension-kind-map.ts";

export { inferTeacherMaterialKindFromDataFile };

function tryMinioStorageKeyFromFileUrl(fileUrl: string): string | null {
  const raw = fileUrl.trim();
  if (!raw) return null;
  try {
    const probe = "__probe_key__";
    const prefix = getDirectUrl(probe).replace(/__probe_key__$/, "");
    if (raw.startsWith(prefix)) return raw.slice(prefix.length);
  } catch {
    return null;
  }
  return null;
}

export type V2DataFileRepairOutcome = {
  fileId: string;
  contentSha256Updated: boolean;
  fileTypeIdUpdated: boolean;
  skipped?: "not_found" | "forbidden" | "nothing_to_fill" | "read_object_failed";
};

export async function runV2DataFileMetadataRepair(
  fileId: string,
  actorId: string | undefined,
): Promise<V2DataFileRepairOutcome> {
  const record = await getFileById(fileId);
  if (!record) return { fileId, contentSha256Updated: false, fileTypeIdUpdated: false, skipped: "not_found" };
  if (actorId && record.ownerUserId && record.ownerUserId !== actorId) {
    return { fileId, contentSha256Updated: false, fileTypeIdUpdated: false, skipped: "forbidden" };
  }
  const needSha = !(record.contentSha256 ?? "").trim();
  const needType = !(record.fileTypeId ?? "").trim();
  if (!needSha && !needType) {
    return { fileId, contentSha256Updated: false, fileTypeIdUpdated: false, skipped: "nothing_to_fill" };
  }
  let shaHex: string | undefined;
  if (needSha) {
    const key = tryMinioStorageKeyFromFileUrl(record.fileUrl);
    if (key) {
      try {
        const buf = await getObjectBuffer(key);
        shaHex = createHash("sha256").update(buf).digest("hex");
      } catch {
        /* 仍尝试补齐 file_type_id */
      }
    }
  }
  let typeId: string | null | undefined;
  if (needType) {
    const kind = inferTeacherMaterialKindFromDataFile(record.fileName, record.fileExt);
    typeId = kind ? await resolveDataFileTypeIdByTeacherMaterialKind(kind) : null;
  }
  const applied = await repairDataFileEmptyMetadataFields(fileId, {
    ...(shaHex ? { contentSha256: shaHex } : {}),
    ...(typeId ? { fileTypeId: typeId } : {}),
  });
  return {
    fileId,
    contentSha256Updated: applied.contentSha256Updated,
    fileTypeIdUpdated: applied.fileTypeIdUpdated,
  };
}
