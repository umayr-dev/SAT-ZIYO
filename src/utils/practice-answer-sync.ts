import { practiceService } from "@/src/services/practice.service";
import type { AnswerPayload } from "@/src/utils/submit-answers-batch";
import { isAnswerPersistedOrTerminalError } from "@/src/utils/submit-answers-batch";

export function answerSyncFingerprint(answer: {
  choiceId?: string;
  textAnswer?: string;
}): string {
  const text =
    answer.textAnswer != null ? String(answer.textAnswer).trim() : "";
  const choice =
    answer.choiceId != null ? String(answer.choiceId).trim() : "";
  return `${choice}|${text}`;
}

/**
 * Sync one answer when the user leaves a question (navigation / tab hide).
 * Skips the request if the answer was already synced with the same content.
 */
export async function syncAnswerToServerIfChanged(
  attemptId: string,
  answer: AnswerPayload,
  syncedFingerprints: Map<string, string>,
): Promise<boolean> {
  if (!answer.questionId) return false;

  const hasContent =
    !!answer.choiceId ||
    (answer.textAnswer != null && String(answer.textAnswer).trim() !== "");
  if (!hasContent) return false;

  const fingerprint = answerSyncFingerprint(answer);
  if (syncedFingerprints.get(answer.questionId) === fingerprint) {
    return true;
  }

  try {
    await practiceService.submitAnswer(
      attemptId,
      answer.questionId,
      answer.choiceId,
      answer.textAnswer,
      answer.markedForReview,
      answer.eliminatedChoices,
    );
    // Only record the fingerprint on a CONFIRMED save, so a non-confirmed
    // result re-syncs on the next navigation instead of being skipped forever.
    syncedFingerprints.set(answer.questionId, fingerprint);
    return true;
  } catch (err) {
    // Terminal (attempt closed) — don't block navigation, but do NOT mark it
    // synced; the localStorage copy remains and the module flush will retry.
    if (isAnswerPersistedOrTerminalError(err)) {
      return true;
    }
    return false;
  }
}
