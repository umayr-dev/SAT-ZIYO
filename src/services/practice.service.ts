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

export interface Passage {
  id: string;
  title: string | null;
  content: string;
  source: string | null;
  wordCount: number | null;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "STUDENT_PRODUCED";
  orderIndex: number;
  passage?: string; // Legacy field - use sharedPassage instead
  passageId?: string | null; // Reference to shared passage
  sharedPassage?: Passage | null; // Included when fetched
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
      },
    );
  }

  /**
   * Submit answer (single)
   */
  async submitAnswer(
    attemptId: string,
    questionId: string,
    choiceId?: string,
    textAnswer?: string,
    markedForReview?: boolean,
    eliminatedChoices?: string[],
  ): Promise<AnswerResponse> {
    const body: any = { questionId };
    if (choiceId) {
      body.choiceId = choiceId;
    }
    if (textAnswer !== undefined) {
      body.textAnswer = textAnswer;
    }
    if (markedForReview !== undefined) {
      body.markedForReview = markedForReview;
    }
    if (eliminatedChoices !== undefined) {
      body.eliminatedChoices = eliminatedChoices;
    }

    return apiClient<AnswerResponse>(
      `/api/practice/attempts/${attemptId}/answer`,
      {
        method: "POST",
        body: JSON.stringify(body),
        requireAuth: true,
      },
    );
  }

  /**
   * Submit multiple answers in batch (production-ready)
   */
  async submitAnswersBatch(
    attemptId: string,
    answers: Array<{
      questionId: string;
      choiceId?: string;
      textAnswer?: string;
      markedForReview?: boolean;
      eliminatedChoices?: string[];
    }>,
  ): Promise<{ success: boolean; processed: number; failed: number }> {
    if (answers.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }

    // Use batch endpoint if available, otherwise fallback to individual requests
    try {
      const response = await apiClient<{
        success: boolean;
        processed: number;
        failed: number;
      }>(`/api/practice/attempts/${attemptId}/answers/batch`, {
        method: "POST",
        body: JSON.stringify({ answers }),
        requireAuth: true,
      });
      return response;
    } catch (error) {
      // Fallback: submit individually (but this should be avoided in production)
      console.warn(
        "[PracticeService] Batch endpoint not available, falling back to individual submissions",
      );

      let processed = 0;
      let failed = 0;

      // Submit in smaller batches to avoid overwhelming server
      const batchSize = 5;
      for (let i = 0; i < answers.length; i += batchSize) {
        const batch = answers.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((answer) =>
            this.submitAnswer(
              attemptId,
              answer.questionId,
              answer.choiceId,
              answer.textAnswer,
              answer.markedForReview,
              answer.eliminatedChoices,
            ),
          ),
        );

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            processed++;
          } else {
            failed++;
          }
        });

        // Small delay between batches
        if (i + batchSize < answers.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      return { success: failed === 0, processed, failed };
    }
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
      },
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
      },
    );
  }

  /**
   * Jump to specific question
   */
  async jumpToQuestion(
    attemptId: string,
    questionIndex: number,
  ): Promise<StartTestResponse> {
    return apiClient<StartTestResponse>(
      `/api/practice/attempts/${attemptId}/goto/${questionIndex}`,
      {
        method: "POST",
        requireAuth: true,
      },
    );
  }

  /**
   * Get answered questions list
   */
  async getAnsweredQuestions(attemptId: string): Promise<AnsweredQuestions> {
    return apiClient<AnsweredQuestions>(
      `/api/practice/attempts/${attemptId}/answers`,
      {
        requireAuth: true,
      },
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
      },
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
      },
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
    return apiClient<TestResults>(
      `/api/practice/attempts/${attemptId}/submit`,
      {
        method: "POST",
        requireAuth: true,
      },
    );
  }

  /**
   * Get test results
   */
  async getResults(attemptId: string): Promise<TestResults> {
    return apiClient<TestResults>(
      `/api/practice/attempts/${attemptId}/results`,
      {
        requireAuth: true,
      },
    );
  }

  /**
   * Save highlights for a question
   */
  async saveHighlights(
    attemptId: string,
    questionId: string,
    highlights: Array<{
      startOffset: number;
      endOffset: number;
      color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
      note?: string | null;
    }>,
  ): Promise<void> {
    return apiClient(`/api/practice/attempts/${attemptId}/highlights`, {
      method: "POST",
      body: JSON.stringify({
        questionId,
        highlights,
      }),
      requireAuth: true,
    });
  }

  /**
   * Get highlights for a question or all questions in attempt
   */
  async getHighlights(
    attemptId: string,
    questionId?: string,
  ): Promise<
    Array<{
      id: string;
      questionId: string;
      startOffset: number;
      endOffset: number;
      color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
      note: string | null;
    }>
  > {
    const url = questionId
      ? `/api/practice/attempts/${attemptId}/highlights?questionId=${questionId}`
      : `/api/practice/attempts/${attemptId}/highlights`;

    return apiClient(url, {
      method: "GET",
      requireAuth: true,
    });
  }

  /**
   * Get test analytics
   */
  async getTestAnalytics(testId: string): Promise<{
    testId: string;
    title: string;
    viewCount: number;
    attemptCount: number;
    completionCount: number;
    completionRate: number;
    averageScore: number | null;
    averageTimeMinutes: number | null;
    commentCount: number;
  }> {
    return apiClient(`/api/tests/${testId}/analytics`, {
      method: "GET",
      requireAuth: true,
    });
  }

  /**
   * Get comments for a test
   */
  async getTestComments(
    testId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Array<{
      id: string;
      content: string;
      isEdited: boolean;
      createdAt: string;
      updatedAt: string;
      user: {
        id: string;
        name: string;
      };
      replyCount: number;
    }>;
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return apiClient(
      `/api/tests/${testId}/comments?page=${page}&limit=${limit}`,
      {
        method: "GET",
        requireAuth: false,
      },
    );
  }

  /**
   * Create a comment
   */
  async createComment(
    testId: string,
    content: string,
  ): Promise<{
    id: string;
    content: string;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
    };
    replyCount: number;
  }> {
    return apiClient(`/api/tests/${testId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
      requireAuth: true,
    });
  }

  /**
   * Get replies to a comment
   */
  async getCommentReplies(
    commentId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Array<{
      id: string;
      content: string;
      parentId: string;
      isEdited: boolean;
      createdAt: string;
      updatedAt: string;
      user: {
        id: string;
        name: string;
      };
      replyCount: number;
    }>;
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return apiClient(
      `/api/comments/${commentId}/replies?page=${page}&limit=${limit}`,
      {
        method: "GET",
        requireAuth: false,
      },
    );
  }

  /**
   * Reply to a comment
   */
  async replyToComment(
    commentId: string,
    content: string,
  ): Promise<{
    id: string;
    content: string;
    parentId: string;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
    };
    replyCount: number;
  }> {
    return apiClient(`/api/comments/${commentId}/replies`, {
      method: "POST",
      body: JSON.stringify({ content }),
      requireAuth: true,
    });
  }

  /**
   * Get full comment thread
   */
  async getCommentThread(
    commentId: string,
    maxDepth: number = 10,
  ): Promise<{
    id: string;
    content: string;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
    };
    replies: Array<any>;
  }> {
    return apiClient(`/api/comments/${commentId}/thread?maxDepth=${maxDepth}`, {
      method: "GET",
      requireAuth: false,
    });
  }

  /**
   * Edit a comment
   */
  async editComment(
    commentId: string,
    content: string,
  ): Promise<{
    id: string;
    content: string;
    isEdited: boolean;
    updatedAt: string;
  }> {
    return apiClient(`/api/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
      requireAuth: true,
    });
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient(`/api/comments/${commentId}`, {
      method: "DELETE",
      requireAuth: true,
    });
  }

  /**
   * Get math reference formulas
   */
  async getMathFormulas(category?: string): Promise<
    Record<
      string,
      Array<{
        id: string;
        name: string;
        formula: string;
        description: string | null;
        imageUrl: string | null;
      }>
    >
  > {
    const url = category
      ? `/api/reference/math-formulas?category=${category}`
      : `/api/reference/math-formulas`;

    return apiClient(url, {
      method: "GET",
      requireAuth: false,
    });
  }
}

export const practiceService = new PracticeService();
