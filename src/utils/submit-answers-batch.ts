import { ApiClientError } from "@/src/lib/api-client";
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
  skipped: number;
};

const DEFAULT_BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasAnswerContent(answer: AnswerPayload): boolean {
  return !!(
    answer.choiceId ||
    (answer.textAnswer != null && String(answer.textAnswer).trim() !== "")
  );
}

function normalizeAnswer(answer: AnswerPayload): AnswerPayload {
  const choiceId =
    answer.choiceId != null && String(answer.choiceId).trim() !== ""
      ? String(answer.choiceId)
      : undefined;
  const textAnswer =
    answer.textAnswer != null && String(answer.textAnswer).trim() !== ""
      ? String(answer.textAnswer).trim()
      : undefined;

  return {
    questionId: String(answer.questionId),
    choiceId,
    textAnswer,
    markedForReview: answer.markedForReview,
    eliminatedChoices: answer.eliminatedChoices,
  };
}

/** Backend may reject re-submits when attempt is closing; treat as already saved. */
export function isAnswerPersistedOrTerminalError(err: unknown): boolean {
  if (!(err instanceof ApiClientError)) return false;
  if (err.status === 401 || err.status === 403) return false;

  const msg = (err.message ?? "").toLowerCase();
  if (
    err.status === 400 ||
    err.status === 409 ||
    err.status === 404 ||
    err.status === 422
  ) {
    return (
      /not in progress/.test(msg) ||
      /already/.test(msg) ||
      /completed/.test(msg) ||
      /submitted/.test(msg) ||
      /duplicate/.test(msg) ||
      /already answered/.test(msg) ||
      /answer already/.test(msg)
    );
  }
  return false;
}

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof ApiClientError)) return true;
  if (err.status === 429 || err.status >= 500) return true;
  return false;
}

async function submitSingleAnswer(
  attemptId: string,
  answer: AnswerPayload,
  toleratePersistedErrors: boolean,
): Promise<"processed" | "failed" | "skipped"> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await practiceService.submitAnswer(
        attemptId,
        answer.questionId,
        answer.choiceId,
        answer.textAnswer,
        answer.markedForReview,
        answer.eliminatedChoices,
      );
      return "processed";
    } catch (err) {
      if (toleratePersistedErrors && isAnswerPersistedOrTerminalError(err)) {
        return "skipped";
      }
      if (!isRetryableError(err) || attempt === MAX_RETRIES - 1) {
        return "failed";
      }
      await delay(RETRY_BASE_MS * (attempt + 1));
    }
  }
  return "failed";
}

async function submitIndividuals(
  attemptId: string,
  answers: AnswerPayload[],
  toleratePersistedErrors: boolean,
): Promise<Pick<BatchSubmitResult, "processed" | "failed" | "skipped">> {
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < answers.length; i++) {
    const outcome = await submitSingleAnswer(
      attemptId,
      answers[i],
      toleratePersistedErrors,
    );
    if (outcome === "processed") processed++;
    else if (outcome === "skipped") skipped++;
    else failed++;

    if (i + 1 < answers.length) {
      await delay(80);
    }
  }

  return { processed, failed, skipped };
}

async function submitBatchOnce(
  attemptId: string,
  batch: AnswerPayload[],
): Promise<{ processed: number; failed: number }> {
  const result = await practiceService.submitAnswersBatch(attemptId, batch);
  const processed = result.processed ?? 0;
  const failed = result.failed ?? 0;

  if (failed > 0 && processed + failed < batch.length) {
    return { processed, failed: batch.length - processed };
  }

  return { processed, failed };
}

async function submitBatchWithFallback(
  attemptId: string,
  batch: AnswerPayload[],
  toleratePersistedErrors: boolean,
): Promise<Pick<BatchSubmitResult, "processed" | "failed" | "skipped">> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await submitBatchOnce(attemptId, batch);
      if (result.failed === 0) {
        return {
          processed: result.processed,
          failed: 0,
          skipped: 0,
        };
      }

      const assumedOk = Math.max(0, result.processed);
      const needRetry = batch.slice(assumedOk);
      if (needRetry.length === 0) {
        return { processed: result.processed, failed: result.failed, skipped: 0 };
      }

      const individual = await submitIndividuals(
        attemptId,
        needRetry,
        toleratePersistedErrors,
      );
      return {
        processed: assumedOk + individual.processed,
        failed: individual.failed,
        skipped: individual.skipped,
      };
    } catch (err) {
      if (toleratePersistedErrors && isAnswerPersistedOrTerminalError(err)) {
        return { processed: 0, failed: 0, skipped: batch.length };
      }
      if (!isRetryableError(err) || attempt === MAX_RETRIES - 1) {
        break;
      }
      await delay(RETRY_BASE_MS * (attempt + 1));
    }
  }

  return submitIndividuals(attemptId, batch, toleratePersistedErrors);
}

/**
 * Submit answers in chunks. Retries transient failures and falls back to per-answer submits.
 */
export async function submitAnswersInBatches(
  attemptId: string,
  answers: AnswerPayload[],
  options?: {
    batchSize?: number;
    throwIfAllFailed?: boolean;
    toleratePersistedErrors?: boolean;
  },
): Promise<BatchSubmitResult> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const throwIfAllFailed = options?.throwIfAllFailed ?? true;
  const toleratePersistedErrors = options?.toleratePersistedErrors ?? true;

  const validAnswers = answers
    .filter((a) => !!a.questionId && hasAnswerContent(a))
    .map(normalizeAnswer);

  if (validAnswers.length === 0) {
    return { total: 0, processed: 0, failed: 0, skipped: 0 };
  }

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < validAnswers.length; i += batchSize) {
    const batch = validAnswers.slice(i, i + batchSize);
    const result = await submitBatchWithFallback(
      attemptId,
      batch,
      toleratePersistedErrors,
    );
    processed += result.processed;
    failed += result.failed;
    skipped += result.skipped;

    if (i + batchSize < validAnswers.length) {
      await delay(200);
    }
  }

  const out = {
    total: validAnswers.length,
    processed,
    failed,
    skipped,
  };

  const effectivelySaved = processed + skipped;
  if (throwIfAllFailed && effectivelySaved === 0 && failed > 0) {
    throw new Error(
      `Failed to save ${failed} answer(s) to the server. Check your connection and try again.`,
    );
  }

  return out;
}
