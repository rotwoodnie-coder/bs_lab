"use client";

import { ExperimentCatalogScreen } from "./_components/experiment-catalog-screen";
import { withPermission } from "@/lib/permissions/with-permission";

function ConsoleExperimentsPage() {
  return <ExperimentCatalogScreen />;
}

export default withPermission(ConsoleExperimentsPage, "/console/settings/experiments");
