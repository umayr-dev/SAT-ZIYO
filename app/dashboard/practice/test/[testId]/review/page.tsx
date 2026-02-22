"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import {
  practiceService,
  TestResults,
  QuestionResult,
  isOpenAnswerQuestion,
  hasChoiceOptions,
  getChoiceText,
  getChoiceImageUrl,
} from "@/src/services/practice.service";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";

export default function QuestionReviewPage() {
  const router = useRouter();
  const params = useParams();
  // Route segment is [testId], value is attemptId
  const attemptId = params.testId as string;

  const [results, setResults] = useState<TestResults | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, [attemptId]);

  async function loadResults() {
    try {
      const testResults = await practiceService.getResults(attemptId);
      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  function getAllQuestions(): QuestionResult[] {
    if (!results) return [];
    const allQuestions: QuestionResult[] = [];
    results.sections.forEach((section) => {
      section.modules.forEach((module) => {
        allQuestions.push(...module.questions);
      });
    });
    return allQuestions;
  }

  function getCurrentQuestion(): QuestionResult | null {
    const questions = getAllQuestions();
    return questions[currentQuestionIndex] || null;
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }

  function handleNext() {
    const questions = getAllQuestions();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
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

  const questions = getAllQuestions();
  const question = getCurrentQuestion();

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-gray-700">No questions found</p>
        </Card>
      </div>
    );
  }

  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/practice/test/${attemptId}/finish`)
            }
            className="mb-4"
          >
            ← Back to Results
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Question Review
          </h1>
          <p className="text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <Card className="p-6 mb-6">
          {/* Correct/Incorrect Badge */}
          <div className="mb-4">
            {question.isCorrect ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">CORRECT</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">INCORRECT</span>
              </div>
            )}
          </div>

          {/* Passage */}
          {question.questionText && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">PASSAGE</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {question.questionText}
              </p>
            </div>
          )}

          {/* Question Text */}
          <div className="mb-6">
            <p className="text-lg font-medium text-gray-900">
              {question.questionText}
            </p>
          </div>

          {/* Multiple Choice Review */}
          {hasChoiceOptions(question) && (
            <div className="space-y-3 mb-6">
              {(question.choices ?? []).map((choice, index) => {
                const letter = String.fromCharCode(65 + index);
                const isCorrect = choice.isCorrect;
                const isUserChoice = choice.id === question.userChoiceId;

                let buttonClass =
                  "w-full text-left p-4 rounded-lg border-2 transition-all";
                if (isCorrect) {
                  buttonClass += " border-green-500 bg-green-50";
                } else if (isUserChoice) {
                  buttonClass += " border-red-500 bg-red-50";
                } else {
                  buttonClass += " border-gray-200 bg-white";
                }

                return (
                  <div key={choice.id} className={buttonClass}>
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          isCorrect
                            ? "bg-green-500 text-white"
                            : isUserChoice
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {letter}
                      </span>
                      <div className="flex-1 min-w-0">
                        {getChoiceText(choice) && (
                          <span className="block text-gray-900">
                            {getChoiceText(choice)}
                          </span>
                        )}
                        {getChoiceImageUrl(choice) && (
                          <span className="block mt-2 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                            <img
                              src={getChoiceImageUrl(choice)!}
                              alt={`Choice ${letter}`}
                              className="rounded object-contain max-h-12 w-full bg-gray-100 min-h-[24px]"
                              loading="lazy"
                            />
                          </span>
                        )}
                        {isCorrect && (
                          <span className="ml-0 mt-1 block text-green-700 font-semibold">
                            (Correct)
                          </span>
                        )}
                        {isUserChoice && !isCorrect && (
                          <span className="ml-0 mt-1 block text-red-700 font-semibold">
                            (Your Answer)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid-in / Text Answer Review – ochiq javob */}
          {isOpenAnswerQuestion(question) && (
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Your Answer</p>
                <p className="text-lg font-mono text-gray-900">
                  {question.userTextAnswer || "No answer provided"}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Correct Answer</p>
                <p className="text-lg font-mono text-gray-900">
                  {question.correctAnswer || "No correct answer provided"}
                </p>
              </div>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Explanation</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirst}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={isLast}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


