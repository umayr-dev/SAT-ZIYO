import type { Attempt } from "@/src/services/practice.service";

export function normalizeAttemptStatus(
  status: string | undefined | null,
): Attempt["status"] {
  const raw = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (raw === "IN_PROGRESS") return "IN_PROGRESS";
  if (raw === "COMPLETED") return "COMPLETED";
  if (raw === "ABANDONED") return "ABANDONED";
  return "ABANDONED";
}

export function normalizeAttempt(attempt: Attempt): Attempt {
  return {
    ...attempt,
    status: normalizeAttemptStatus(attempt.status),
  };
}
