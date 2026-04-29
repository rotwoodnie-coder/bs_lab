"use client";

import { Button, sonnerToast } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import { fetchV2FilePresignedUrl, patchV2FileRecord, type V2DataFileRecord } from "@/lib/v2/v2-file-api";

type Props = {
  row: V2DataFileRecord;
  actor: ApiActor;
  refresh: () => Promise<void>;
};

const core = (a: ApiActor) => a as import("@/lib/core-api-shared").CoreApiActor;

export function ConsoleMediaRowActions({ row, actor, refresh }: Props) {
  const openView = async () => {
    try {
      const { presignedUrl } = await fetchV2FilePresignedUrl(core(actor), row.fileId, "view");
      window.open(presignedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "无法打开预览");
    }
  };

  const download = async () => {
    try {
      const { presignedUrl } = await fetchV2FilePresignedUrl(core(actor), row.fileId, "download");
      window.open(presignedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "无法生成下载链接");
    }
  };

  const copySupportId = () => {
    void navigator.clipboard
      .writeText(row.fileId)
      .then(() => sonnerToast.success("已复制文件编号（排障用）"))
      .catch(() => sonnerToast.error("复制失败"));
  };

  const toggleStatus = async () => {
    const next = (row.status ?? "y").toLowerCase() === "n" ? "y" : "n";
    try {
      await patchV2FileRecord(core(actor), row.fileId, { status: next });
      sonnerToast.success(next === "y" ? "已设为启用" : "已设为停用");
      await refresh();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "更新状态失败");
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" size="sm" variant="secondary" onClick={() => void openView()}>
        预览
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => void download()}>
        下载
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={copySupportId}>
        复制编号
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => void toggleStatus()}>
        {(row.status ?? "y").toLowerCase() === "n" ? "启用" : "停用"}
      </Button>
    </div>
  );
}
