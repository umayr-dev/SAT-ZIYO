/**
 * Practice Test Service
 * Handles all test-taking related API calls
 */

import { apiClient } from "@/src/lib/api-client";

export interface Test {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  sections: TestSection[];
  totalDuration?: number;
  totalQuestions?: number;
}

export interface TestSection {
  sectionType: "ENGLISH" | "MATH";
  duration: number;
  allowCalculator: boolean;
  modules: {
    moduleNumber: number;
    questionCount: number;
    duration: number;
  }[];
}

export interface Attempt {
  id: string;
  testId: string;
  testTitle: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  totalScore?: number;
  startedAt: string;
  completedAt?: string;
}

export interface StartTestResponse {
  attemptId: string;
  testTitle: string;
  currentSection: {
    id: string;
    type: "ENGLISH" | "MATH";
    orderIndex: number;
    duration: number;
    allowCalculator: boolean;
  };
  currentModule: {
    id: string;
    moduleNumber: number;
    duration: number;
    totalQuestions: number;
  };
  currentQuestionIndex: number;
  question: Question;
  breakStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface Question {
  id: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "STUDENT_PRODUCED";
  orderIndex: number;
  passage?: string;
  imageUrl?: string;
  choices?: {
    id: string;
    choiceText: string;
    orderIndex: number;
  }[];
}

export interface AnswerResponse {
  success: boolean;
  answeredAt: string;
}

export interface AnsweredQuestions {
  answers: {
    questionId: string;
    questionIndex: number;
    answered: boolean;
  }[];
  totalQuestions: number;
  answeredCount: number;
}

export interface FinishModuleResponse {
  message: string;
  nextStep: "MODULE_2" | "BREAK" | "NEW_SECTION" | "SUBMIT_TEST" | "COMPLETE";
  module1Score?: number;
  module2Difficulty?: "EASY" | "HARD";
  breakDuration?: number;
  breakEndsAt?: string;
  section?: {
    id: string;
    type: "ENGLISH" | "MATH";
    allowCalculator: boolean;
  };
}

export interface BreakStatusResponse {
  breakStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  breakEndsAt?: string;
  remainingSeconds?: number;
  message: string;
  nextStep?: "NEW_SECTION";
  section?: {
    id: string;
    type: "ENGLISH" | "MATH";
    allowCalculator: boolean;
  };
}

export interface TestResults {
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  completedAt: string;
  sections: SectionResult[];
}

export interface SectionResult {
  sectionType: "ENGLISH" | "MATH";
  score: number;
  modules: ModuleResult[];
}

export interface ModuleResult {
  moduleNumber: number;
  difficulty: "EASY" | "HARD";
  score: number;
  correctCount: number;
  totalCount: number;
  questions: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "STUDENT_PRODUCED";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  userChoiceId?: string;
  userTextAnswer?: string;
  correctChoiceId?: string;
  correctAnswer?: string;
  isCorrect: boolean;
  explanation?: string;
  choices?: {
    id: string;
    choiceText: string;
    isCorrect: boolean;
  }[];
}

class PracticeService {
  /**
   * Get available tests
   */
  async getAvailableTests(): Promise<Test[]> {
    // Use Next.js API proxy route to ensure cookies are forwarded
    return apiClient<Test[]>("/api/practice/tests", {
      requireAuth: true,
    });
  }

  /**
   * Get user's attempt history
   */
  async getMyAttempts(testId?: string): Promise<Attempt[]> {
    // Use Next.js API proxy route to ensure cookies are forwarded
    const url = testId
      ? `/api/practice/my-attempts?testId=${testId}`
      : "/api/practice/my-attempts";
    return apiClient<Attempt[]>(url, {
      requireAuth: true,
    });
  }

  /**
   * Start or resume a test
   */
  async startTest(testId: string): Promise<StartTestResponse> {
    // Use Next.js API proxy route to ensure cookies (JWT) are forwarded correctly
    return apiClient<StartTestResponse>(`/api/practice/start/${testId}`, {
      method: "POST",
      requireAuth: true,
    });
  }

  /**
   * Get current question
   */
  async getCurrentQuestion(attemptId: string): Promise<StartTestResponse> {
    return apiClient<StartTestResponse>(
      `/api/practice/attempts/${attemptId}/current`,
      {
        requireAuth: true,
      }
    );
  }

  /**
   * Submit answer
   */
  async submitAnswer(
    attemptId: string,
    questionId: string,
    choiceId?: string,
    textAnswer?: string
  ): Promise<AnswerResponse> {
    const body: any = { questionId };
    if (choiceId) {
      body.choiceId = choiceId;
    }
    if (textAnswer !== undefined) {
      body.textAnswer = textAnswer;
    }

    return apiClient<AnswerResponse>(`/api/practice/attempts/${attemptId}/answer`, {
      method: "POST",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  }

  /**
   * Navigate to next question
   */
  async nextQuestion(attemptId: string): Promise<StartTestResponse> {
    return apiClient<StartTestResponse>(
      `/api/practice/attempts/${attemptId}/next`,
      {
        method: "POST",
        requireAuth: true,
      }
    );
  }

  /**
   * Navigate to previous question
   */
  async previousQuestion(attemptId: string): Promise<StartTestResponse> {
    return apiClient<StartTestResponse>(
      `/api/practice/attempts/${attemptId}/previous`,
      {
        method: "POST",
        requireAuth: true,
      }
    );
  }

  /**
   * Jump to specific question
   */
  async jumpToQuestion(
    attemptId: string,
    questionIndex: number
  ): Promise<StartTestResponse> {
    return apiClient<StartTestResponse>(
      `/api/practice/attempts/${attemptId}/goto/${questionIndex}`,
      {
        method: "POST",
        requireAuth: true,
      }
    );
  }

  /**
   * Get answered questions list
   */
  async getAnsweredQuestions(
    attemptId: string
  ): Promise<AnsweredQuestions> {
    return apiClient<AnsweredQuestions>(
      `/api/practice/attempts/${attemptId}/answers`,
      {
        requireAuth: true,
      }
    );
  }

  /**
   * Finish current module
   */
  async finishModule(attemptId: string): Promise<FinishModuleResponse> {
    return apiClient<FinishModuleResponse>(
      `/api/practice/attempts/${attemptId}/finish-module`,
      {
        method: "POST",
        requireAuth: true,
      }
    );
  }

  /**
   * Check break status
   */
  async checkBreakStatus(attemptId: string): Promise<BreakStatusResponse> {
    return apiClient<BreakStatusResponse>(
      `/api/practice/attempts/${attemptId}/break-status`,
      {
        requireAuth: true,
      }
    );
  }

  /**
   * Abandon attempt
   */
  async abandonAttempt(attemptId: string): Promise<void> {
    return apiClient<void>(`/api/practice/attempts/${attemptId}/abandon`, {
      method: "POST",
      requireAuth: true,
    });
  }

  /**
   * Submit test for scoring
   */
  async submitTest(attemptId: string): Promise<TestResults> {
    return apiClient<TestResults>(`/api/practice/attempts/${attemptId}/submit`, {
      method: "POST",
      requireAuth: true,
    });
  }

  /**
   * Get test results
   */
  async getResults(attemptId: string): Promise<TestResults> {
    return apiClient<TestResults>(
      `/api/practice/attempts/${attemptId}/results`,
      {
        requireAuth: true,
      }
    );
  }
}

export const practiceService = new PracticeService();

