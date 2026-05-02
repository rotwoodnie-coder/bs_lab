type QuizOption = {
  id: string;
  label: string;
};

type QuizQuestion = {
  id: string;
  stem: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  rewardPoints: number;
};

type QuizSubmission = {
  questionId: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
  isCorrect: boolean;
  submittedAt: number;
  rewardPoints: number;
};

type QuizStats = {
  total: number;
  correct: number;
  lastSubmittedAt: number | null;
};

const QUIZ_QUESTION: QuizQuestion = {
  id: "quiz_001",
  stem: "下列哪一项是水的三态变化中‘凝固’的结果？",
  options: [
    { id: "a", label: "水蒸气变成水" },
    { id: "b", label: "水变成冰" },
    { id: "c", label: "冰变成水蒸气" },
    { id: "d", label: "水变成水蒸气" },
  ],
  correctOptionId: "b",
  explanation: "凝固是液态变成固态，水变成冰属于凝固。",
  rewardPoints: 10,
};

const state = {
  question: QUIZ_QUESTION,
  stats: {
    total: 0,
    correct: 0,
    lastSubmittedAt: null,
  } as QuizStats,
  lastSubmission: null as QuizSubmission | null,
};

export function getQuizQuestion() {
  return state.question;
}

export function getQuizStats() {
  return state.stats;
}

export function getLastQuizSubmission() {
  return state.lastSubmission;
}

export function submitQuizAnswer(optionId: string) {
  const selectedOption = state.question.options.find((option) => option.id === optionId);
  if (!selectedOption) {
    throw new Error("无效的答案选项");
  }

  const isCorrect = optionId === state.question.correctOptionId;

  state.stats = {
    total: state.stats.total + 1,
    correct: state.stats.correct + (isCorrect ? 1 : 0),
    lastSubmittedAt: Date.now(),
  };

  state.lastSubmission = {
    questionId: state.question.id,
    selectedOptionId: optionId,
    selectedOptionLabel: selectedOption.label,
    isCorrect,
    submittedAt: state.stats.lastSubmittedAt ?? Date.now(),
    rewardPoints: isCorrect ? state.question.rewardPoints : 0,
  };

  return {
    question: state.question,
    stats: state.stats,
    submission: state.lastSubmission,
  };
}
