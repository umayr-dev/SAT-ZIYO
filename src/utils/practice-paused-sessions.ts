/** Local registry so dashboard shows Continue after save & exit (even before API refresh). */

export type PausedTestSession = {
  attemptId: string;
  testId: string;
  testTitle: string;
  savedAt: number;
};

const STORAGE_KEY = "sat_ziyo_paused_tests";

export function registerPausedTest(session: PausedTestSession): void {
  if (typeof window === "undefined") return;
  try {
    const list = listPausedTests().filter(
      (s) => s.attemptId !== session.attemptId,
    );
    list.unshift(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to register paused test:", err);
  }
}

export function listPausedTests(): PausedTestSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PausedTestSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearPausedTest(attemptId: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = listPausedTests().filter((s) => s.attemptId !== attemptId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getAttemptMeta(attemptId: string): {
  testId: string;
  testTitle: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`test_meta_${attemptId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { testId?: string; testTitle?: string };
    if (!parsed.testId) return null;
    return {
      testId: parsed.testId,
      testTitle: parsed.testTitle || "Practice Test",
    };
  } catch {
    return null;
  }
}

export function saveAttemptMeta(
  attemptId: string,
  meta: { testId: string; testTitle: string },
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`test_meta_${attemptId}`, JSON.stringify(meta));
  } catch {
    // ignore
  }
}
