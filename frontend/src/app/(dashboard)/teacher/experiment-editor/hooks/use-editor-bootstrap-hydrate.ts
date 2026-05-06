"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sonnerToast } from "@bs-lab/ui";

import type { RichMediaEmbed } from "@bs-lab/ui";

export function useEditorAiOutlinePrefill(
  prefillAiOutline: boolean,
  expId: string | null,
  setSummary: (v: string) => void,
  setTeachingContextContent: (v: string) => void,
  setScienceStory: (v: string) => void,
  setCurriculum: (v: string) => void,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  React.useEffect(() => {
    if (expId) return;
    if (!prefillAiOutline) return;
    const next = new URLSearchParams(searchParams.toString());
    if (!next.has("prefillAiOutline")) return;
    next.delete("prefillAiOutline");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    sonnerToast.message("未使用浏览器存储载入大纲", {
      description: "AI 预填请通过课标/服务端入口下发；可手动粘贴到表单。",
    });
  }, [expId, pathname, prefillAiOutline, router, searchParams]);
}
