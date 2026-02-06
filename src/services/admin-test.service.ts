/**
 * Admin Test Management Service
 * Handles test creation, question management, and validation
 */

import { apiClient } from "@/src/lib/api-client";

export interface CreateTestTemplateResponse {
  testId: string;
  title: string;
  structure: {
    englishSection: {
      module1: string;
      module2Easy: string;
      module2Hard: string;
      totalQuestionsNeeded: number;
    };
    mathSection: {
      module1: string;
      module2Easy: string;
      module2Hard: string;
      totalQuestionsNeeded: number;
    };
    grandTotalQuestionsNeeded: number;
  };
  modules: {
    moduleId: string;
    sectionType: "ENGLISH" | "MATH";
    moduleNumber: number;
    difficulty: "EASY" | "HARD";
  }[];
  message: string;
}

export interface TestValidation {
  testId: string;
  title: string;
  isValid: boolean;
  isReadyForStudents: boolean;
  modules: {
    sectionType: "ENGLISH" | "MATH";
    moduleNumber: number;
    difficulty: "EASY" | "HARD";
    expectedQuestions: number;
    actualQuestions: number;
    isComplete: boolean;
  }[];
  issues: string[];
  message: string;
}

export interface QuestionInput {
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "STUDENT_PRODUCED";
  orderIndex: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  passage?: string;
  /** Backend GCS ga yuklash uchun: data:image/png;base64,... (IMAGE_UPLOAD_API.md Method 1) */
  imageBase64?: string;
  imageUrl?: string;
  contentDomain?: string;
  correctAnswer?: string; // For STUDENT_PRODUCED
  explanation?: string;
  choices?: {
    choiceText: string;
    isCorrect: boolean;
    orderIndex: number;
    /** Backend GCS ga yuklash uchun: data:image/png;base64,... */
    imageBase64?: string;
    imageUrl?: string;
  }[];
}

/** Response from upload endpoints */
export interface UploadImageResponse {
  url: string;
  filename?: string;
  originalName?: string;
  size?: number;
  contentType?: string;
}

class AdminTestService {
  /**
   * Create SAT test template
   */
  async createTestTemplate(
    title: string,
    description?: string,
  ): Promise<CreateTestTemplateResponse> {
    const response = await fetch("/api/admin/tests/sat-template", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ title, description }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || error.error || "Failed to create SAT test template",
      );
    }

    return response.json();
  }

  /**
   * Create full test with sections and modules
   */
  async createTest(data: {
    title: string;
    description?: string;
    sections: any[];
    accessType?: "FREE" | "PREMIUM";
  }): Promise<{ id: string; title: string }> {
    const response = await fetch("/api/admin/tests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Failed to create test");
    }

    return response.json();
  }

  /**
   * Get all tests
   */
  async getAllTests(): Promise<any[]> {
    const response = await fetch("/api/admin/tests", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Failed to fetch tests");
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get test by ID
   */
  async getTestById(testId: string): Promise<any> {
    const response = await fetch(`/api/admin/tests/${testId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Failed to fetch test");
    }

    return response.json();
  }

  /**
   * Update test
   */
  async updateTest(
    testId: string,
    data: {
      title?: string;
      description?: string;
      isActive?: boolean;
      accessType?: "FREE" | "PREMIUM";
    },
  ): Promise<any> {
    const response = await fetch(`/api/admin/tests/${testId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Failed to update test");
    }

    return response.json();
  }

  /**
   * Delete test
   */
  async deleteTest(testId: string): Promise<void> {
    const response = await fetch(`/api/admin/tests/${testId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Failed to delete test");
    }
  }

  /**
   * Barcha modullarga savollarni bitta so'rovda yuborish (bulk)
   * Body: { modules: [ { moduleId: string, questions: QuestionInput[] } ] }
   */
  async submitAllQuestions(
    testId: string,
    payload: { modules: { moduleId: string; questions: QuestionInput[] }[] },
  ): Promise<{ success: boolean; totalAdded: number }> {
    const response = await fetch(`/api/admin/tests/${testId}/questions/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || "Bulk add failed");
    }
    return response.json();
  }

  /**
   * Add question to module
   */
  async addQuestionToModule(
    moduleId: string,
    question: QuestionInput,
  ): Promise<any> {
    const response = await fetch(
      `/api/admin/tests/modules/${moduleId}/questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(question),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Failed to add question");
    }

    return response.json();
  }

  /**
   * Update question
   */
  async updateQuestion(
    moduleId: string,
    questionId: string,
    question: Partial<QuestionInput>,
  ): Promise<any> {
    const response = await fetch(
      `/api/admin/tests/modules/${moduleId}/questions/${questionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(question),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || error.error || "Failed to update question",
      );
    }

    return response.json();
  }

  /**
   * Delete question
   */
  async deleteQuestion(moduleId: string, questionId: string): Promise<void> {
    const response = await fetch(
      `/api/admin/tests/modules/${moduleId}/questions/${questionId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || error.error || "Failed to delete question",
      );
    }
  }

  /**
   * Upload question image (file → backend GCS → url).
   * Use returned url in question.imageUrl to avoid 413 Payload Too Large.
   */
  async uploadQuestionImage(file: File): Promise<UploadImageResponse> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/storage/upload/question-image", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? "Question image upload failed");
    }
    return res.json();
  }

  /**
   * Upload choice image (file → backend GCS → url).
   * Use returned url in choices[].imageUrl.
   */
  async uploadChoiceImage(file: File): Promise<UploadImageResponse> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/storage/upload/choice-image", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? "Choice image upload failed");
    }
    return res.json();
  }

  /**
   * Validate test structure
   */
  async validateTest(testId: string): Promise<TestValidation> {
    const response = await fetch(`/api/admin/tests/${testId}/validate`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || error.error || "Failed to validate test",
      );
    }

    return response.json();
  }
}

export const adminTestService = new AdminTestService();
