"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/ui/dialog";
import {
  practiceService,
  TestResults,
  QuestionResult,
  isOpenAnswerQuestion,
  hasChoiceOptions,
  getChoiceText,
  getChoiceImageUrl,
  getQuestionImageUrl,
} from "@/src/services/practice.service";
import { ApiClientError } from "@/src/lib/api-client";
import { CommentsSection } from "@/src/components/comments/CommentsSection";
import { TestAnalytics } from "@/src/components/practice/TestAnalytics";
import {
  Trophy,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Tab = "all" | "rw" | "math";

export default function FinishTestPage() {
  const router = useRouter();
  const params = useParams();
  // Route segment is [testId], value is attemptId
  const attemptId = params.testId as string;

  const [results, setResults] = useState<TestResults | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Question review state
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<QuestionResult[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  // Get storage key for answers (same as test page: test_answers_attemptId, keys inside s0_m1_0 etc.)
  const getStorageKey = useCallback(() => `test_answers_${attemptId}`, [attemptId]);

  // Get storage key for highlights
  const getHighlightsStorageKey = useCallback(() => `test_highlights_${attemptId}`, [attemptId]);

  // Get all answers from all modules for submit (keys s{section}_m{module}_{index})
  const getAllAnswersForSubmit = useCallback((): Array<{
    questionId: string;
    choiceId?: string;
    textAnswer?: string;
    markedForReview?: boolean;
    eliminatedChoices?: string[];
  }> => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return [];
      const answers = JSON.parse(stored) as Record<string, Record<string, unknown>>;
      return Object.keys(answers)
        .filter((k) => /^s\d+_m\d+_\d+$/.test(k))
        .filter((k) => {
          const entry = answers[k] as { choiceId?: string; textAnswer?: string };
          return !!(
            entry?.choiceId ||
            (entry?.textAnswer != null && String(entry.textAnswer).trim() !== "")
          );
        })
        .map((k) => answers[k] as {
          questionId: string;
          choiceId?: string;
          textAnswer?: string;
          markedForReview?: boolean;
          eliminatedChoices?: string[];
        });
    } catch (err) {
      console.error("Failed to get answers from localStorage:", err);
      return [];
    }
  }, [getStorageKey]);

  // Submit all pending answers from localStorage (all modules) to server
  const submitAllPendingAnswers = useCallback(async () => {
    const allAnswers = getAllAnswersForSubmit();

    if (allAnswers.length === 0) {
      console.log("[Finish Page] No answers to submit");
      return;
    }

    console.log(`[Finish Page] Submitting ${allAnswers.length} answers to server...`);

    const BATCH_SIZE = 10;
    for (let i = 0; i < allAnswers.length; i += BATCH_SIZE) {
      const batch = allAnswers.slice(i, i + BATCH_SIZE);
      try {
        await practiceService.submitAnswersBatch(attemptId, batch.map((a) => ({
          questionId: a.questionId,
          choiceId: a.choiceId,
          textAnswer: a.textAnswer,
          markedForReview: a.markedForReview,
          eliminatedChoices: a.eliminatedChoices,
        })));
      } catch (err) {
        for (const answer of batch) {
          try {
            await practiceService.submitAnswer(
              attemptId,
              answer.questionId,
              answer.choiceId,
              answer.textAnswer,
              answer.markedForReview,
              answer.eliminatedChoices
            );
          } catch {
            // continue
          }
        }
      }
      if (i + BATCH_SIZE < allAnswers.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    console.log("[Finish Page] All answers submitted successfully");

    try {
      localStorage.removeItem(getStorageKey());
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
    }
  }, [attemptId, getAllAnswersForSubmit, getStorageKey]);

  // Submit all highlights from localStorage
  const submitAllHighlights = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(getHighlightsStorageKey());
      if (!stored) {
        console.log("[Finish Page] No highlights to submit");
        return;
      }

      const highlights = JSON.parse(stored);
      const highlightsArray = Object.entries(highlights) as Array<[string, Array<{
        startOffset: number;
        endOffset: number;
        color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
        note?: string | null;
      }>]>;

      if (highlightsArray.length === 0) {
        console.log("[Finish Page] No highlights to submit");
        return;
      }

      console.log(`[Finish Page] Submitting ${highlightsArray.length} question highlights to server...`);

      const submitPromises: Promise<void>[] = [];
      let delay = 0;

      for (const [questionId, highlightList] of highlightsArray) {
        if (highlightList.length === 0) continue;

        submitPromises.push(
          (async () => {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay += 50;

            try {
              await practiceService.saveHighlights(attemptId, questionId, highlightList);
            } catch (err) {
              console.error(`Failed to submit highlights for question ${questionId}:`, err);
            }
          })()
        );
      }

      await Promise.all(submitPromises);
      console.log("[Finish Page] All highlights submitted successfully");

      // Clear highlights from localStorage after successful submission
      try {
        localStorage.removeItem(getHighlightsStorageKey());
      } catch (err) {
        console.error("Failed to clear highlights from localStorage:", err);
      }
    } catch (err) {
      console.error("Failed to submit highlights:", err);
    }
  }, [attemptId, getHighlightsStorageKey]);

  const submitTest = useCallback(async () => {
    try {
      setSubmitting(true);
      setError("");

      // First, submit all answers and highlights from localStorage
      await Promise.all([
        submitAllPendingAnswers(),
        submitAllHighlights(),
      ]);

      // Then submit the test for scoring
      try {
        const testResults = await practiceService.submitTest(attemptId);
        setResults(testResults);
      } catch (submitErr) {
        // Backend may return "This attempt is not in progress" if already submitted (e.g. refresh, double submit, timer ended)
        const isNotInProgress =
          submitErr instanceof ApiClientError &&
          submitErr.status === 400 &&
          /not in progress/i.test(submitErr.message ?? "");
        if (isNotInProgress) {
          const testResults = await practiceService.getResults(attemptId);
          setResults(testResults);
        } else {
          throw submitErr;
        }
      }

      // Get testId from attempt
      try {
        const attempts = await practiceService.getMyAttempts();
        const attempt = attempts.find((a) => a.id === attemptId);
        if (attempt) {
          setTestId(attempt.testId);
        }
      } catch (err) {
        console.error("Failed to get testId from attempt:", err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit test");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }, [attemptId, submitAllPendingAnswers, submitAllHighlights]);

  useEffect(() => {
    submitTest();
  }, [submitTest]);

  // ---- Helpers ----

  function getTabQuestions(tab: Tab): QuestionResult[] {
    if (!results) return [];
    const flat: QuestionResult[] = [];
    // ENGLISH first then MATH per spec
    for (const type of ["ENGLISH", "MATH"] as const) {
      const section = results.sections.find((s) => s.sectionType === type);
      if (!section) continue;
      for (const mod of section.modules) {
        flat.push(...mod.questions);
      }
    }
    if (tab === "all") return flat;
    if (tab === "rw") return flat.filter((q) => q.sectionType === "ENGLISH");
    return flat.filter((q) => q.sectionType === "MATH");
  }

  function getUserAnswerText(q: QuestionResult): string {
    if (q.isUnanswered) return "—";
    if (isOpenAnswerQuestion(q)) return q.userTextAnswer || "—";
    if (q.userChoiceId && q.choices?.length) {
      const c = q.choices.find((c) => c.id === q.userChoiceId);
      return c ? getChoiceText(c) : "—";
    }
    return "—";
  }

  function getCorrectAnswerText(q: QuestionResult): string {
    if (isOpenAnswerQuestion(q)) return q.correctAnswer || "—";
    if (q.choices?.length) {
      const c = q.choices.find((c) => c.isCorrect);
      return c ? getChoiceText(c) : "—";
    }
    return "—";
  }

  function openReview(questions: QuestionResult[], index: number) {
    setReviewQuestions(questions);
    setReviewIndex(index);
    setReviewOpen(true);
  }

  // ---- Loading / Error ----

  if (loading || submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">
            {submitting ? "Submitting your test..." : "Loading results..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-red-700">{error || "Failed to load results"}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/practice")}
            className="mt-4"
          >
            Back to Tests
          </Button>
        </Card>
      </div>
    );
  }

  // ---- Score display ----

  const roundToTens = (n: number) => Math.round(Number(n) / 10) * 10;
  const sectionScore = (s: number) => Math.max(200, roundToTens(s));
  const totalScoreDisplay = Math.max(400, roundToTens(results.totalScore ?? 0));

  const englishSection = results.sections.find((s) => s.sectionType === "ENGLISH");
  const mathSection = results.sections.find((s) => s.sectionType === "MATH");

  const englishScoreDisplay =
    results.readingWritingScore != null
      ? sectionScore(results.readingWritingScore)
      : englishSection?.scaledScore != null
        ? sectionScore(englishSection.scaledScore)
        : englishSection?.score != null
          ? sectionScore(englishSection.score)
          : null;

  const mathScoreDisplay =
    results.mathScore != null
      ? sectionScore(results.mathScore)
      : mathSection?.scaledScore != null
        ? sectionScore(mathSection.scaledScore)
        : mathSection?.score != null
          ? sectionScore(mathSection.score)
          : null;

  // Performance stats — use new performance field or fall back to old top-level fields
  const perf = results.performance;
  const correct = perf?.correct ?? results.correctAnswers ?? 0;
  const incorrect = perf?.incorrect ?? results.wrongAnswers ?? 0;
  const unanswered = perf?.unanswered ?? 0;
  const accuracy =
    perf?.accuracy ??
    (correct + incorrect + unanswered > 0
      ? Math.round((correct / (correct + incorrect + unanswered)) * 100)
      : 0);

  // ---- Tab questions ----
  const allQuestions = getTabQuestions("all");
  const rwQuestions = getTabQuestions("rw");
  const mathQuestions = getTabQuestions("math");
  const tabQuestions =
    activeTab === "all" ? allQuestions : activeTab === "rw" ? rwQuestions : mathQuestions;

  // ---- Review modal ----
  const reviewQuestion = reviewQuestions[reviewIndex] ?? null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="w-14 h-14 mx-auto text-yellow-500 mb-3" />
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Test Results</h1>
          {results.completedAt && (
            <p className="text-sm text-gray-500">
              Completed{" "}
              {new Date(results.completedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Score Hero */}
        <Card className="p-8 mb-6 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Total SAT Score
          </p>
          <div className="text-7xl font-bold text-blue-600 mb-1">{totalScoreDisplay}</div>
          <p className="text-sm text-gray-400 mb-1">out of 1600</p>
          {results.percentile != null && (
            <p className="text-sm text-gray-500">{results.percentile}th percentile</p>
          )}

          {/* Section scores */}
          <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Reading &amp; Writing</p>
              <p className="text-4xl font-bold text-gray-900">{englishScoreDisplay ?? "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5">out of 800</p>
              {englishSection?.module2Difficulty && (
                <p className="text-xs text-gray-400 mt-1">
                  Module 2:{" "}
                  {englishSection.module2Difficulty === "HARD" ? "Hard" : "Standard"}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Math</p>
              <p className="text-4xl font-bold text-gray-900">{mathScoreDisplay ?? "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5">out of 800</p>
              {mathSection?.module2Difficulty && (
                <p className="text-xs text-gray-400 mt-1">
                  Module 2:{" "}
                  {mathSection.module2Difficulty === "HARD" ? "Hard" : "Standard"}
                </p>
              )}
            </div>
          </div>

          {/* Performance summary */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-2xl font-bold text-green-600">{correct}</p>
              <p className="text-xs text-gray-500 mt-0.5">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{incorrect}</p>
              <p className="text-xs text-gray-500 mt-0.5">Incorrect</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400">{unanswered}</p>
              <p className="text-xs text-gray-500 mt-0.5">Unanswered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{accuracy}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Accuracy</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-center mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/practice")}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Question Review */}
        <Card className="mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Question Review</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(["all", "rw", "math"] as Tab[]).map((tab) => {
              const label =
                tab === "all"
                  ? "All"
                  : tab === "rw"
                  ? "Reading & Writing"
                  : "Math";
              const count =
                tab === "all"
                  ? allQuestions.length
                  : tab === "rw"
                  ? rwQuestions.length
                  : mathQuestions.length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}{" "}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Question table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="text-left px-4 py-3 font-medium w-10">#</th>
                  <th className="text-left px-4 py-3 font-medium">Mod</th>
                  <th className="text-left px-4 py-3 font-medium">Section</th>
                  <th className="text-left px-4 py-3 font-medium">Your Answer</th>
                  <th className="text-left px-4 py-3 font-medium">Correct Answer</th>
                  <th className="text-center px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {tabQuestions.map((q, i) => {
                  const userAns = getUserAnswerText(q);
                  const correctAns = getCorrectAnswerText(q);
                  const sectionLabel =
                    q.sectionType === "ENGLISH" ? "R&W" : q.sectionType === "MATH" ? "Math" : "—";
                  const qNum = q.questionNumber ?? i + 1;
                  return (
                    <tr
                      key={`${q.questionId}-${i}`}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-700 font-medium">{qNum}</td>
                      <td className="px-4 py-3 text-gray-500">
                        Mod {q.moduleNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{sectionLabel}</td>
                      <td
                        className="px-4 py-3 text-gray-700 max-w-[160px] truncate"
                        title={userAns}
                      >
                        {userAns}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-700 max-w-[160px] truncate"
                        title={correctAns}
                      >
                        {correctAns}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {q.isUnanswered ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs font-bold">
                            —
                          </span>
                        ) : q.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          className="text-xs h-7 px-3"
                          onClick={() => openReview(tabQuestions, i)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {tabQuestions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      No questions available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Test Analytics */}
        {testId && (
          <div className="mb-8">
            <TestAnalytics testId={testId} />
          </div>
        )}

        {/* Comments Section */}
        {testId && (
          <div className="mb-8">
            <CommentsSection testId={testId} />
          </div>
        )}
      </div>

      {/* Question Review Modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-base font-semibold text-gray-900">
              Question Review
            </DialogTitle>
          </DialogHeader>

          {/* Navigation bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <Button
              variant="outline"
              className="h-8 px-3 text-sm flex items-center gap-1"
              onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
              disabled={reviewIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              {reviewIndex + 1} / {reviewQuestions.length}
            </span>
            <Button
              variant="outline"
              className="h-8 px-3 text-sm flex items-center gap-1"
              onClick={() =>
                setReviewIndex((i) =>
                  Math.min(reviewQuestions.length - 1, i + 1)
                )
              }
              disabled={reviewIndex === reviewQuestions.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Scrollable question content */}
          {reviewQuestion && (
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Result badge */}
              <div>
                {reviewQuestion.isUnanswered ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wide">
                    Unanswered
                  </span>
                ) : reviewQuestion.isCorrect ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                    <XCircle className="w-3.5 h-3.5" />
                    Incorrect
                  </span>
                )}
              </div>

              {/* Passage */}
              {(reviewQuestion.sharedPassage || reviewQuestion.passage) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  {reviewQuestion.sharedPassage ? (
                    <>
                      {reviewQuestion.sharedPassage.title && (
                        <p className="font-semibold text-gray-800 text-sm mb-2">
                          {reviewQuestion.sharedPassage.title}
                        </p>
                      )}
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {reviewQuestion.sharedPassage.content}
                      </p>
                      {reviewQuestion.sharedPassage.source && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                          — {reviewQuestion.sharedPassage.source}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {reviewQuestion.passage}
                    </p>
                  )}
                </div>
              )}

              {/* Question image */}
              {getQuestionImageUrl(reviewQuestion) && (
                <div>
                  <img
                    src={getQuestionImageUrl(reviewQuestion)!}
                    alt="Question diagram"
                    className="max-w-full rounded border border-gray-200"
                  />
                </div>
              )}

              {/* Question text */}
              <p className="text-base font-medium text-gray-900 leading-relaxed">
                {reviewQuestion.questionText}
              </p>

              {/* MCQ choices */}
              {hasChoiceOptions(reviewQuestion) && (
                <div className="space-y-2">
                  {[...(reviewQuestion.choices ?? [])]
                    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    .map((choice, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isCorrect = choice.isCorrect;
                      const isUser = choice.id === reviewQuestion.userChoiceId;
                      return (
                        <div
                          key={choice.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
                            isCorrect
                              ? "border-green-500 bg-green-50"
                              : isUser
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : isUser
                                ? "bg-red-400 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {letter}
                          </span>
                          <div className="flex-1 min-w-0">
                            {getChoiceText(choice) && (
                              <span className="text-sm text-gray-900">
                                {getChoiceText(choice)}
                              </span>
                            )}
                            {getChoiceImageUrl(choice as Record<string, unknown>) && (
                              <img
                                src={getChoiceImageUrl(choice as Record<string, unknown>)!}
                                alt={`Choice ${letter}`}
                                className="mt-1 max-h-16 rounded object-contain"
                              />
                            )}
                            <div className="flex gap-2 mt-0.5">
                              {isCorrect && (
                                <span className="text-xs font-semibold text-green-600">
                                  Correct answer
                                </span>
                              )}
                              {isUser && !isCorrect && (
                                <span className="text-xs font-semibold text-red-500">
                                  Your answer
                                </span>
                              )}
                              {isUser && isCorrect && (
                                <span className="text-xs font-semibold text-green-600">
                                  Your answer · Correct
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Student-produced answer */}
              {isOpenAnswerQuestion(reviewQuestion) && (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                    <p className="font-mono text-gray-900 text-sm">
                      {reviewQuestion.userTextAnswer || "No answer provided"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Correct Answer</p>
                    <p className="font-mono text-gray-900 text-sm">
                      {reviewQuestion.correctAnswer || "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {reviewQuestion.explanation && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Explanation
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {reviewQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
