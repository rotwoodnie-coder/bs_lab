import * as React from "react";

import type { ExperimentMaterialDraft, ExperimentStepDraft } from "../types";
import { normalizeStepDraft } from "../utils/step-content-filled";
import { useCanvasState } from "./use-canvas-state";
import { useStepManagement } from "./use-step-management";

export function useEditorEngine(args: {
  anchors: readonly { id: string }[];
  initialMaterials?: ExperimentMaterialDraft[];
  initialSteps?: ExperimentStepDraft[];
}) {
  const step = useStepManagement();
  const canvas = useCanvasState(args.anchors);
  const latestRef = React.useRef({ steps: step.steps, materials: step.materials });
  const initializedRef = React.useRef({ materials: false, steps: false });

  React.useEffect(() => {
    latestRef.current = { steps: step.steps, materials: step.materials };
  }, [step.materials, step.steps]);

  React.useEffect(() => {
    if (initializedRef.current.materials) return;
    if (args.initialMaterials && args.initialMaterials.length > 0) {
      step.setMaterials(args.initialMaterials);
      initializedRef.current.materials = true;
    }
  }, [args.initialMaterials, step.setMaterials]);

  React.useEffect(() => {
    if (initializedRef.current.steps) return;
    if (args.initialSteps && args.initialSteps.length > 0) {
      step.setSteps(args.initialSteps.map((s) => normalizeStepDraft(s)));
      initializedRef.current.steps = true;
    }
  }, [args.initialSteps, step.setSteps]);

  return {
    step,
    canvas,
    latestRef,
  };
}

