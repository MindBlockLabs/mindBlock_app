interface QuizAnswerFeedback {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

const detailedBreakdown: QuizAnswerFeedback[] = [];