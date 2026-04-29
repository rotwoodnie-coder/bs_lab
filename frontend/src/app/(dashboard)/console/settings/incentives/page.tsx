"use client";

import { IncentivesScreen } from "./_components/incentives-screen";
import { useIncentivesConsole } from "./page.hooks";

export default function ConsoleIncentivesPage() {
  const screen = useIncentivesConsole();
  return <IncentivesScreen screen={screen} />;
}
