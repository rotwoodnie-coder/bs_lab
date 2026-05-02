export type VideoStepState = "idle" | "playing" | "speeching" | "locked" | "completed";

export type VideoStepItem = {
  id: string;
  title: string;
  duration: number;
  safetyNote: string;
  startAt?: number;
};

type StepMachineInput = {
  steps: VideoStepItem[];
  initialStepId?: string | null;
};

type StepMachineSnapshot = {
  state: VideoStepState;
  currentStepId: string | null;
  currentStepIndex: number;
  canGoNext: boolean;
  canGoBack: boolean;
  isLocked: boolean;
};

export function createVideoStepMachine(input: StepMachineInput) {
  let state: VideoStepState = input.steps.length > 0 ? "idle" : "completed";
  let currentStepId = input.initialStepId ?? input.steps[0]?.id ?? null;

  const currentIndex = () => input.steps.findIndex((step) => step.id === currentStepId);

  const snapshot = (): StepMachineSnapshot => {
    const idx = currentIndex();
    return {
      state,
      currentStepId,
      currentStepIndex: idx,
      canGoBack: idx > 0,
      canGoNext: idx >= 0 && idx < input.steps.length - 1 && (state === "playing" || state === "completed"),
      isLocked: state === "speeching" || state === "locked",
    };
  };

  const getCurrentStep = () => input.steps[currentIndex()] ?? null;

  const moveToStepIndex = (targetIndex: number) => {
    const cur = currentIndex();
    if (targetIndex < 0 || targetIndex >= input.steps.length) return snapshot();
    if (state === "speeching" || state === "locked") return snapshot();
    if (cur >= 0 && targetIndex > cur + 1) return snapshot();
    currentStepId = input.steps[targetIndex]?.id ?? currentStepId;
    state = targetIndex === input.steps.length - 1 ? "completed" : "playing";
    return snapshot();
  };

  return {
    getSnapshot: snapshot,
    getCurrentStep,
    start() {
      if (state === "completed") return snapshot();
      state = "playing";
      return snapshot();
    },
    requestStep(stepId: string) {
      const targetIndex = input.steps.findIndex((step) => step.id === stepId);
      if (targetIndex === -1) return snapshot();
      return moveToStepIndex(targetIndex);
    },
    beginSpeech() {
      if (state === "completed") return snapshot();
      state = "speeching";
      return snapshot();
    },
    lock() {
      if (state === "completed") return snapshot();
      state = "locked";
      return snapshot();
    },
    unlock() {
      if (state === "completed") return snapshot();
      state = "playing";
      return snapshot();
    },
    complete() {
      state = "completed";
      return snapshot();
    },
    goNext() {
      const idx = currentIndex();
      return moveToStepIndex(idx + 1);
    },
    goBack() {
      const idx = currentIndex();
      return moveToStepIndex(Math.max(0, idx - 1));
    },
  };
}
