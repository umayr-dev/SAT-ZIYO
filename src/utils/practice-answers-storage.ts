import type { AnswerPayload } from "@/src/utils/submit-answers-batch";

export function getPracticeAnswersStorageKey(attemptId: string): string {
  return `test_answers_${attemptId}`;
}

export function buildModulePrefix(
  sectionOrderIndex: number,
  moduleNumber: number,
): string {
  return `s${sectionOrderIndex}_m${moduleNumber}_`;
}

export function parseModulePrefix(
  prefix: string,
): { sectionOrderIndex: number; moduleNumber: number } | null {
  const match = prefix.match(/^s(\d+)_m(\d+)_$/);
  if (!match) return null;
  return {
    sectionOrderIndex: Number(match[1]),
    moduleNumber: Number(match[2]),
  };
}

function hasActualAnswer(entry: {
  choiceId?: string;
  textAnswer?: string;
}): boolean {
  return !!(
    entry?.choiceId ||
    (entry.textAnswer != null && String(entry.textAnswer).trim() !== "")
  );
}

/** Read one saved answer without mutating state (used during persist / restore). */
export function readPracticeAnswerAtIndex(
  attemptId: string,
  modulePrefix: string,
  questionIndex: number,
): AnswerPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(getPracticeAnswersStorageKey(attemptId));
    if (!stored) return null;
    const answers = JSON.parse(stored) as Record<string, AnswerPayload>;
    const entry = answers[`${modulePrefix}${questionIndex}`];
    return entry?.questionId ? entry : null;
  } catch {
    return null;
  }
}

export function savePracticeAnswer(
  attemptId: string,
  modulePrefix: string,
  questionIndex: number,
  answer: AnswerPayload,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getPracticeAnswersStorageKey(attemptId);
    const stored = localStorage.getItem(key);
    const answers: Record<string, AnswerPayload> = stored
      ? JSON.parse(stored)
      : {};
    answers[`${modulePrefix}${questionIndex}`] = answer;
    localStorage.setItem(key, JSON.stringify(answers));
  } catch (err) {
    console.error("Failed to save practice answer to localStorage:", err);
  }
}

export function removePracticeAnswer(
  attemptId: string,
  modulePrefix: string,
  questionIndex: number,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getPracticeAnswersStorageKey(attemptId);
    const stored = localStorage.getItem(key);
    if (!stored) return;
    const answers = JSON.parse(stored) as Record<string, unknown>;
    delete answers[`${modulePrefix}${questionIndex}`];
    localStorage.setItem(key, JSON.stringify(answers));
  } catch (err) {
    console.error("Failed to remove practice answer from localStorage:", err);
  }
}

function enrichAnswerFromKey(
  attemptId: string,
  key: string,
  entry: AnswerPayload,
): AnswerPayload | null {
  if (!hasActualAnswer(entry)) return null;

  if (entry.questionId) return entry;

  const match = key.match(/^s(\d+)_m(\d+)_(\d+)$/);
  if (!match) return null;

  const questionCacheKey = `test_questions_${attemptId}_s${match[1]}_m${match[2]}`;
  try {
    const raw = sessionStorage.getItem(questionCacheKey);
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, { id?: string }>;
    const questionId = cache[match[3]]?.id;
    if (!questionId) return null;
    return { ...entry, questionId };
  } catch {
    return null;
  }
}

/** All answered questions across modules (keys s{section}_m{module}_{index}). */
export function getAllPracticeAnswersForSubmit(
  attemptId: string,
): AnswerPayload[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(getPracticeAnswersStorageKey(attemptId));
    if (!stored) return [];

    const answers = JSON.parse(stored) as Record<string, AnswerPayload>;
    const result: AnswerPayload[] = [];

    for (const [key, entry] of Object.entries(answers)) {
      if (!/^s\d+_m\d+_\d+$/.test(key)) continue;
      const enriched = enrichAnswerFromKey(attemptId, key, entry);
      if (enriched?.questionId) result.push(enriched);
    }

    return result;
  } catch (err) {
    console.error("Failed to read practice answers from localStorage:", err);
    return [];
  }
}

/**
 * Module answers for submit, with questionId backfilled from session question cache when missing.
 */
export function getModuleAnswersForSubmit(
  attemptId: string,
  modulePrefix: string,
): AnswerPayload[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(getPracticeAnswersStorageKey(attemptId));
    if (!stored) return [];

    const answers = JSON.parse(stored) as Record<string, AnswerPayload>;
    const result: AnswerPayload[] = [];

    for (const [key, entry] of Object.entries(answers)) {
      if (!key.startsWith(modulePrefix)) continue;
      const enriched = enrichAnswerFromKey(attemptId, key, entry);
      if (enriched?.questionId) result.push(enriched);
    }

    return result;
  } catch (err) {
    console.error("Failed to read module answers from localStorage:", err);
    return [];
  }
}

export function clearPracticeAnswersStorage(attemptId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getPracticeAnswersStorageKey(attemptId));
  } catch {
    // ignore
  }
}

/**
 * Remove ONLY the answers the server confirmed it saved (by questionId). This
 * is the safe prune: answers that failed to save stay in localStorage for the
 * next flush/retry instead of being deleted by an aggregate "something saved"
 * heuristic.
 */
export function removePracticeAnswersByQuestionIds(
  attemptId: string,
  questionIds: string[],
): void {
  if (typeof window === "undefined") return;
  if (!questionIds || questionIds.length === 0) return;
  try {
    const saved = new Set(questionIds.map((id) => String(id)));
    const key = getPracticeAnswersStorageKey(attemptId);
    const stored = localStorage.getItem(key);
    if (!stored) return;
    const answers = JSON.parse(stored) as Record<string, AnswerPayload>;
    let changed = false;
    for (const [k, entry] of Object.entries(answers)) {
      if (!/^s\d+_m\d+_\d+$/.test(k)) continue;
      const enriched = enrichAnswerFromKey(attemptId, k, entry);
      const qid = enriched?.questionId ?? entry?.questionId;
      if (qid && saved.has(String(qid))) {
        delete answers[k];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(key, JSON.stringify(answers));
    }
  } catch (err) {
    console.error("Failed to prune saved practice answers from localStorage:", err);
  }
}

/** Remove synced module answers so finish page does not re-submit them. */
export function removePracticeAnswersByPrefix(
  attemptId: string,
  prefix: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getPracticeAnswersStorageKey(attemptId);
    const stored = localStorage.getItem(key);
    if (!stored) return;
    const answers = JSON.parse(stored) as Record<string, unknown>;
    let changed = false;
    for (const k of Object.keys(answers)) {
      if (k.startsWith(prefix)) {
        delete answers[k];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(key, JSON.stringify(answers));
    }
  } catch (err) {
    console.error("Failed to prune practice answers from localStorage:", err);
  }
}
