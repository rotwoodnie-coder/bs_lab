export type VideoStepState = "idle" | "playing" | "speeching" | "locked" | "completed";

export type VideoStepItem = {
  id: string;
  title: string;
  safetyNote: string | null;
  time: number;
};

type StepMachineInput = {
  steps: VideoStepItem[];
};

export type StepMachineSnapshot = {
  currentStepId: string | null;
  currentStepIndex: number;
};

export function createVideoStepMachine(input: StepMachineInput) {
  let currentStepId = input.steps[0]?.id ?? null;

  const currentIndex = () => input.steps.findIndex((step) => step.id === currentStepId);

  const snapshot = (): StepMachineSnapshot => ({
    currentStepId,
    currentStepIndex: currentIndex(),
  });

  return {
    getSnapshot: snapshot,
    requestStep(stepId: string) {
      const targetIndex = input.steps.findIndex((step) => step.id === stepId);
      if (targetIndex === -1) return snapshot();
      currentStepId = input.steps[targetIndex]?.id ?? currentStepId;
      return snapshot();
    },
    goNext() {
      const idx = currentIndex();
      const nextIndex = Math.min(input.steps.length - 1, Math.max(0, idx + 1));
      currentStepId = input.steps[nextIndex]?.id ?? currentStepId;
      return snapshot();
    },
    goBack() {
      const idx = currentIndex();
      const prevIndex = Math.max(0, idx - 1);
      currentStepId = input.steps[prevIndex]?.id ?? currentStepId;
      return snapshot();
    },
  };
}
