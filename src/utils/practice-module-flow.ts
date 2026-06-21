import type { FinishModuleResponse } from "@/src/services/practice.service";

/** Normalize backend nextStep strings for reliable switching. */
export function normalizePracticeNextStep(
  step: string | undefined | null,
): string {
  return String(step ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function isBreakStep(step: string): boolean {
  return step === "BREAK" || step.includes("BREAK");
}

export function isContinueTestStep(step: string): boolean {
  return (
    step === "MODULE_2" ||
    step === "NEW_SECTION" ||
    step === "NEXT_MODULE" ||
    step === "CONTINUE" ||
    step === "START_MODULE_2" ||
    // RELOAD = backend lost a concurrent finishModule claim; just re-fetch the
    // current state (the other call already advanced) instead of finishing.
    step === "RELOAD" ||
    step.startsWith("MODULE_")
  );
}

export function isFinishTestStep(step: string): boolean {
  return (
    step === "SUBMIT_TEST" ||
    step === "COMPLETE" ||
    step === "FINISH" ||
    step === "FINISHED" ||
    step === "END" ||
    step === "DONE"
  );
}

export function nextStepFromFinishModule(
  result: FinishModuleResponse,
): string {
  return normalizePracticeNextStep(result.nextStep);
}
