import { ApiClientError } from "@/src/lib/api-client";
import { practiceService } from "@/src/services/practice.service";

export type AnswerPayload = {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  markedForReview?: boolean;
  eliminatedChoices?: string[];
  /**
   * Epoch ms at which the SERVER confirmed this answer was stored.
   * Present = already persisted, so it is excluded from future flushes but
   * still counted by the UI. See practice-answers-storage.ts — the local store
   * is both the outbox and the display model, so entries are tombstoned rather
   * than deleted. Deleting them made the question navigator visibly empty out
   * after a partial save, which students read as losing their work.
   */
  syncedAt?: number;
};

export type BatchSubmitResult = {
  total: number;
  processed: number;
  failed: number;
  skipped: number;
  /**
   * Answers the server refused for a reason no retry can fix (module closed,
   * wrong module, payload the server will never accept). Counted apart from
   * `failed` because `failed` means "try again" and these never succeed — the
   * finish page looped on them forever, wedging the student out of their own
   * results.
   */
  rejected: number;
  /** Question IDs the server CONFIRMED it saved — safe to prune locally. */
  savedQuestionIds: string[];
  /** Question IDs behind `rejected`, for the message shown to the student. */
  rejectedQuestionIds: string[];
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

  // 409 Conflict almost always means the answer is already on the server.
  if (err.status === 409) return true;

  if (
    err.status === 400 ||
    err.status === 404 ||
    err.status === 422
  ) {
    // DANGER ZONE. Returning true here tells the caller "the server already has
    // this answer", which makes the flush report success and lets the finish
    // page finalize the test. If we say that about an answer the server
    // REFUSED, the student is scored as if the question were blank.
    //
    // The previous version matched /module.*(complete|finished|closed)/, which
    // matches the backend's "Module is closed for answers (time expired)" —
    // a REFUSAL, not a persist. That single pattern is how completed tests
    // lost answers. Only patterns that unambiguously mean "already stored"
    // belong here; everything else must count as failed and stay in
    // localStorage for retry.
    return (
      /already answered/.test(msg) ||
      /answer already/.test(msg) ||
      /already exists/.test(msg) ||
      /duplicate/.test(msg) ||
      // The whole attempt is finalized, so no further write can ever land.
      // Terminal, and the answer is either stored or unrecoverable — but the
      // caller must not treat this as a reason to prune, so it is reported as
      // "skipped" rather than "processed".
      /attempt.*(not in progress|completed|submitted)/.test(msg) ||
      /this attempt is not in progress/.test(msg)
    );
  }
  return false;
}

/**
 * True when the server refused this answer permanently. Same status codes as
 * the persisted check above, but the opposite conclusion: the answer is NOT on
 * the server and never will be, so the caller must stop retrying and say so
 * rather than reporting a transient failure.
 */
export function isPermanentRejection(err: unknown): boolean {
  if (!(err instanceof ApiClientError)) return false;
  if (isAnswerPersistedOrTerminalError(err)) return false;
  return err.status === 400 || err.status === 404 || err.status === 422;
}

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof ApiClientError)) return true;
  // status 0 = network failure / timeout (api-client maps these to
  // ApiClientError with status 0). A wifi blip or a pm2 restart mid-request
  // MUST be retried — classifying it as terminal is how a 2-second outage
  // permanently blocked the module-review Continue button.
  if (err.status === 0) return true;
  if (err.status === 429 || err.status >= 500) return true;
  return false;
}

type SubResult = Pick<
  BatchSubmitResult,
  "processed" | "failed" | "skipped" | "rejected" | "savedQuestionIds" | "rejectedQuestionIds"
>;

async function submitSingleAnswer(
  attemptId: string,
  answer: AnswerPayload,
  toleratePersistedErrors: boolean,
): Promise<"processed" | "failed" | "skipped" | "rejected"> {
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
      if (isPermanentRejection(err)) {
        return "rejected";
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
): Promise<SubResult> {
  let processed = 0;
  let failed = 0;
  let skipped = 0;
  let rejected = 0;
  const savedQuestionIds: string[] = [];
  const rejectedQuestionIds: string[] = [];

  for (let i = 0; i < answers.length; i++) {
    const outcome = await submitSingleAnswer(
      attemptId,
      answers[i],
      toleratePersistedErrors,
    );
    if (outcome === "processed") {
      processed++;
      // Only confirmed writes are safe to prune. "Skipped" (already/terminal)
      // must NOT auto-prune — a misclassified error would delete the only
      // local copy before the server actually has the answer.
      savedQuestionIds.push(answers[i].questionId);
    } else if (outcome === "skipped") {
      skipped++;
    } else if (outcome === "rejected") {
      rejected++;
      rejectedQuestionIds.push(answers[i].questionId);
    } else {
      failed++;
    }

    if (i + 1 < answers.length) {
      await delay(80);
    }
  }

  return { processed, failed, skipped, rejected, savedQuestionIds, rejectedQuestionIds };
}

async function submitBatchWithFallback(
  attemptId: string,
  batch: AnswerPayload[],
  toleratePersistedErrors: boolean,
): Promise<SubResult> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await practiceService.submitAnswersBatch(attemptId, batch);
      const savedIds = result.savedQuestionIds;
      const saved = new Set((savedIds ?? []).map(String));
      const batchFailed = result.failed ?? 0;
      const batchProcessed = result.processed ?? 0;

      // Backend saved the batch but returned no per-question IDs (legacy / proxy default []).
      // Trust processed count — do NOT re-submit individually (causes duplicate rejections).
      if (
        (!savedIds || savedIds.length === 0) &&
        batchFailed === 0 &&
        batchProcessed >= batch.length
      ) {
        return {
          processed: batch.length,
          failed: 0,
          skipped: 0,
          rejected: 0,
          savedQuestionIds: batch.map((b) => String(b.questionId)),
          rejectedQuestionIds: [],
        };
      }

      // Server returned explicit per-question outcomes.
      if (savedIds && savedIds.length > 0) {
        const failedItems = batch.filter((b) => !saved.has(String(b.questionId)));
        if (failedItems.length === 0) {
          return {
            processed: saved.size,
            failed: 0,
            skipped: 0,
            rejected: 0,
            savedQuestionIds: [...saved],
            rejectedQuestionIds: [],
          };
        }
        const indiv = await submitIndividuals(
          attemptId,
          failedItems,
          toleratePersistedErrors,
        );
        return {
          processed: saved.size + indiv.processed,
          failed: indiv.failed,
          skipped: indiv.skipped,
          rejected: indiv.rejected,
          savedQuestionIds: [...saved, ...indiv.savedQuestionIds],
          rejectedQuestionIds: indiv.rejectedQuestionIds,
        };
      }

      // Ambiguous batch response → submit individually to learn real outcomes.
      return submitIndividuals(attemptId, batch, toleratePersistedErrors);
    } catch (err) {
      if (toleratePersistedErrors && isAnswerPersistedOrTerminalError(err)) {
        return {
          processed: 0,
          failed: 0,
          skipped: batch.length,
          rejected: 0,
          savedQuestionIds: [],
          rejectedQuestionIds: [],
        };
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

  // Deduplicate by questionId (last write wins) — re-submitting the same
  // question twice in one batch often makes the 2nd call look like a "failed save".
  const byQuestionId = new Map<string, AnswerPayload>();
  for (const raw of answers) {
    if (!raw.questionId || !hasAnswerContent(raw)) continue;
    const normalized = normalizeAnswer(raw);
    byQuestionId.set(String(normalized.questionId), normalized);
  }
  const validAnswers = Array.from(byQuestionId.values());

  if (validAnswers.length === 0) {
    return {
      total: 0,
      processed: 0,
      failed: 0,
      skipped: 0,
      rejected: 0,
      savedQuestionIds: [],
      rejectedQuestionIds: [],
    };
  }

  let processed = 0;
  let failed = 0;
  let skipped = 0;
  let rejected = 0;
  const savedQuestionIds: string[] = [];
  const rejectedQuestionIds: string[] = [];

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
    rejected += result.rejected;
    savedQuestionIds.push(...result.savedQuestionIds);
    rejectedQuestionIds.push(...result.rejectedQuestionIds);

    if (i + batchSize < validAnswers.length) {
      await delay(200);
    }
  }

  const out = {
    total: validAnswers.length,
    processed,
    failed,
    skipped,
    rejected,
    savedQuestionIds,
    rejectedQuestionIds,
  };

  const effectivelySaved = processed + skipped;
  if (throwIfAllFailed && effectivelySaved === 0 && failed > 0) {
    throw new Error(
      `Failed to save ${failed} answer(s) to the server. Check your connection and try again.`,
    );
  }

  return out;
}
