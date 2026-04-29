"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

/**
 * 全区干预运行时文案：仅存于内存，不读 mock、不写 localStorage。
 * 持久化需后端 `exp_msg` 扩展字段或独立配置表后再接 API。
 */
export function useEditorBootstrapRuntime(intervention: boolean, expId: string | null) {
  const [rtSafety, setRtSafety] = React.useState("");
  const [rtMaterial, setRtMaterial] = React.useState("");

  React.useEffect(() => {
    if (!intervention || !expId) {
      setRtSafety("");
      setRtMaterial("");
    }
  }, [expId, intervention]);

  const saveRuntimeConfig = React.useCallback(() => {
    if (!expId) return;
    sonnerToast.message("运行时配置未持久化", {
      description: "当前仅保存在本页内存；需后端接口后再写入数据库。",
    });
  }, [expId]);

  return { rtSafety, setRtSafety, rtMaterial, setRtMaterial, saveRuntimeConfig };
}
