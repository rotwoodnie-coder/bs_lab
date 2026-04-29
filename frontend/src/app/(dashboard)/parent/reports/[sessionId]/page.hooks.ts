"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchParentReport,
  fetchParentSessionDetail,
  type ParentReportRecord,
} from "@/lib/v2/v2-parent-session-api";

export function useParentReportPage() {
  const { hydrated, actor } = useSessionActor();
  const params = useParams();
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";

  const [report, setReport] = React.useState<ParentReportRecord | null>(null);
  const [sessionDetail, setSessionDetail] = React.useState<{
    expName: string;
    teacherName: string | null;
    teacherStarRating: number | null;
    studentName: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!hydrated || !sessionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchParentReport(actor, sessionId).catch(() => null),
      fetchParentSessionDetail(actor, sessionId).catch(() => null),
    ])
      .then(([r, s]) => {
        setReport(r);
        if (s) {
          setSessionDetail({
            expName: s.expName,
            teacherName: s.teacherName,
            teacherStarRating: s.teacherStarRating,
            studentName: s.studentName,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [hydrated, actor, sessionId]);

  return {
    loading,
    report,
    sessionDetail,
    sessionId,
  };
}
