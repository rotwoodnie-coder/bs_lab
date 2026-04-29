import type { ReactNode } from "react";

import { ConsoleWorkbenchLayout } from "@/components/console/console-workbench-layout";

export default function ConsoleRouteLayout({ children }: { children: ReactNode }) {
  return <ConsoleWorkbenchLayout>{children}</ConsoleWorkbenchLayout>;
}
