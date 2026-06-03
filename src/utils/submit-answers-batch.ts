import { practiceService } from "@/src/services/practice.service";

export type AnswerPayload = {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  markedForReview?: boolean;
  eliminatedChoices?: string[];
};

export type BatchSubmitResult = {
  total: number;
  processed: number;
  failed: number;
};

const DEFAULT_BATCH_SIZE = 10;

/**
 * Submit answers in chunks (API max 20 per request). Throws if every answer fails.
 */
export async function submitAnswersInBatches(
  attemptId: string,
  answers: AnswerPayload[],
  options?: { batchSize?: number; throwIfAllFailed?: boolean },
): Promise<BatchSubmitResult> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const throwIfAllFailed = options?.throwIfAllFailed ?? true;

  if (answers.length === 0) {
    return { total: 0, processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < answers.length; i += batchSize) {
    const batch = answers.slice(i, i + batchSize);
    try {
      const result = await practiceService.submitAnswersBatch(attemptId, batch);
      processed += result.processed ?? batch.length;
      failed += result.failed ?? 0;
    } catch {
      for (const answer of batch) {
        try {
          await practiceService.submitAnswer(
            attemptId,
            answer.questionId,
            answer.choiceId,
            answer.textAnswer,
            answer.markedForReview,
            answer.eliminatedChoices,
          );
          processed++;
        } catch {
          failed++;
        }
      }
    }

    if (i + batchSize < answers.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const out = { total: answers.length, processed, failed };
  if (throwIfAllFailed && processed === 0 && failed > 0) {
    throw new Error(
      `Failed to save ${failed} answer(s) to the server. Check your connection and try again.`,
    );
  }
  return out;
}
