"use client";

import { PageHeader } from "@/components/layout/page-header";
import { QuestionsScreen } from "./_components/questions-screen";
import { useConsoleAssessmentQuestionsScreen } from "./page.hooks";

export default function ConsoleAssessmentQuestionsPage() {
  const screen = useConsoleAssessmentQuestionsScreen();
  return <QuestionsScreen screen={screen} />;
}
