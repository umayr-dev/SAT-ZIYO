"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Loading } from "@/src/ui/loading";
import {
  adminTestService,
  QuestionInput,
} from "@/src/services/admin-test.service";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Module {
  moduleId: string;
  sectionType: "ENGLISH" | "MATH";
  moduleNumber: number;
  difficulty: "EASY" | "HARD";
  questionCount?: number;
  questions?: Question[];
}

interface Question {
  id: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "STUDENT_PRODUCED";
  orderIndex: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  passage?: string;
  imageUrl?: string;
  contentDomain?: string;
  explanation?: string;
  choices?: {
    id: string;
    choiceText: string;
    isCorrect: boolean;
    orderIndex: number;
  }[];
  correctAnswer?: string;
}

interface TestInfo {
  id: string;
  title: string;
  modules: Module[];
}

export default function TestQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const [mounted, setMounted] = useState(false);
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<
    "MULTIPLE_CHOICE" | "STUDENT_PRODUCED"
  >("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "EASY"
  );
  const [contentDomain, setContentDomain] = useState<string>("");
  const [passage, setPassage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [choices, setChoices] = useState<
    { text: string; isCorrect: boolean }[]
  >([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const englishDomains = [
    { value: "INFORMATION_AND_IDEAS", label: "Information and Ideas" },
    { value: "CRAFT_AND_STRUCTURE", label: "Craft and Structure" },
    { value: "EXPRESSION_OF_IDEAS", label: "Expression of Ideas" },
    {
      value: "STANDARD_ENGLISH_CONVENTIONS",
      label: "Standard English Conventions",
    },
  ];

  const mathDomains = [
    { value: "ALGEBRA", label: "Algebra" },
    { value: "ADVANCED_MATH", label: "Advanced Math" },
    {
      value: "PROBLEM_SOLVING_DATA",
      label: "Problem Solving and Data Analysis",
    },
    { value: "GEOMETRY_TRIGONOMETRY", label: "Geometry and Trigonometry" },
  ];

  const availableDomains =
    selectedModule?.sectionType === "MATH" ? mathDomains : englishDomains;

  useEffect(() => {
    setMounted(true);
    if (testId) {
      loadTestInfo();
    }
  }, [testId]);

  // Auto-select first module when testInfo loads
  useEffect(() => {
    if (testInfo && testInfo.modules && testInfo.modules.length > 0 && !selectedModule) {
      setSelectedModule(testInfo.modules[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testInfo]);

  async function loadTestInfo() {
    try {
      setLoading(true);
      const test = await adminTestService.getTestById(testId);
      console.log("[Questions Page] Test loaded:", test);
      console.log("[Questions Page] Test modules:", test.modules);
      
      setTestInfo(test);
      setError(""); // Clear any previous errors

      // If test has modules, use them directly
      if (test.modules && test.modules.length > 0) {
        console.log("[Questions Page] Using test.modules directly");
        return; // Modules already loaded, exit early
      }

      // If test has sections, extract modules from sections
      if (test.sections && Array.isArray(test.sections) && test.sections.length > 0) {
        console.log("[Questions Page] Extracting modules from sections");
        const modules: Module[] = [];
        
        for (const section of test.sections) {
          if (section.modules && Array.isArray(section.modules)) {
            for (const moduleItem of section.modules) {
              modules.push({
                moduleId: moduleItem.id || moduleItem.moduleId || `${testId}-${section.sectionType}-${moduleItem.moduleNumber}-${moduleItem.difficulty}`,
                sectionType: section.sectionType,
                moduleNumber: moduleItem.moduleNumber,
                difficulty: moduleItem.difficulty || "EASY",
                questionCount: moduleItem.questionCount || (section.sectionType === "ENGLISH" ? 27 : 22),
                questions: moduleItem.questions || [],
              });
            }
          }
        }

        if (modules.length > 0) {
          console.log("[Questions Page] Loaded modules from sections:", modules);
          setTestInfo({ ...test, modules });
          return;
        }
      }

      // If no modules, try to get from sessionStorage (for template tests)
      if (!test.modules || test.modules.length === 0) {
        console.log("[Questions Page] No modules in test, checking sessionStorage");
        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem(
            `sat-template-modules-${testId}`
          );
          if (stored) {
            try {
              const templateModules = JSON.parse(stored) as {
                moduleId: string;
                sectionType: "ENGLISH" | "MATH";
                moduleNumber: number;
                difficulty: "EASY" | "HARD";
              }[];

              let modules: Module[] = templateModules.map((m) => ({
                moduleId: m.moduleId,
                sectionType: m.sectionType,
                moduleNumber: m.moduleNumber,
                difficulty: m.difficulty,
              }));

              // Try to get validation for question counts, but don't fail if it doesn't work
              try {
                const validation = await adminTestService.validateTest(testId);
                modules = modules.map((m) => {
                  const vm = validation.modules.find(
                    (v) =>
                      v.sectionType === m.sectionType &&
                      v.moduleNumber === m.moduleNumber &&
                      v.difficulty === m.difficulty
                  );
                  return {
                    ...m,
                    questionCount: vm?.expectedQuestions,
                  };
                });
              } catch (e) {
                // Validation failed - this is OK, we can still add questions
                // Use default question counts based on module type
                console.warn("Failed to load validation data for modules, using defaults", e);
                modules = modules.map((m) => {
                  // Default question counts for SAT
                  const defaultCount = m.sectionType === "ENGLISH" ? 27 : 22;
                  return {
                    ...m,
                    questionCount: defaultCount,
                  };
                });
              }

              console.log("[Questions Page] Loaded modules from sessionStorage:", modules);
              setTestInfo({ ...test, modules });
            } catch (e) {
              console.error("Failed to parse stored template modules", e);
            }
          } else {
            // No modules in test and no stored modules - show error
            console.warn("[Questions Page] No modules found in test or sessionStorage");
            setError("No modules found for this test. Please create modules first or check if the test was created correctly.");
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load test";
      setError(errorMessage);
      console.error("Failed to load test info:", err);
      // Don't redirect - let user see the error and try again
    } finally {
      setLoading(false);
    }
  }

  function handleAddChoice() {
    setChoices([...choices, { text: "", isCorrect: false }]);
  }

  function handleRemoveChoice(index: number) {
    setChoices(choices.filter((_, i) => i !== index));
  }

  function handleChoiceChange(
    index: number,
    field: "text" | "isCorrect",
    value: string | boolean
  ) {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setChoices(newChoices);
  }

  async function handleSubmitQuestion() {
    if (!selectedModule) {
      setError("Please select a module first");
      return;
    }

    if (!questionText.trim()) {
      setError("Question text is required");
      return;
    }

    if (questionType === "MULTIPLE_CHOICE") {
      const validChoices = choices.filter((c) => c.text.trim());
      if (validChoices.length < 2) {
        setError("At least 2 choices are required");
        return;
      }
      const correctCount = validChoices.filter((c) => c.isCorrect).length;
      if (correctCount !== 1) {
        setError("Exactly one choice must be marked as correct");
        return;
      }
    } else {
      if (!correctAnswer.trim()) {
        setError("Correct answer is required for grid-in questions");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const questionData: QuestionInput = {
        questionText: questionText.trim(),
        questionType,
        orderIndex: 0,
        difficulty,
        contentDomain: contentDomain || undefined,
        passage: passage.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        explanation: explanation.trim() || undefined,
      };

      if (questionType === "MULTIPLE_CHOICE") {
        questionData.choices = choices
          .filter((c) => c.text.trim())
          .map((c, idx) => ({
            choiceText: c.text.trim(),
            isCorrect: c.isCorrect,
            orderIndex: idx,
          }));
      } else {
        questionData.correctAnswer = correctAnswer.trim();
      }

      await adminTestService.addQuestionToModule(
        selectedModule.moduleId,
        questionData
      );

      setSuccess("Question added successfully!");
      setQuestionText("");
      setContentDomain("");
      setPassage("");
      setImageUrl("");
      setExplanation("");
      setCorrectAnswer("");
      setChoices([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ]);

      await loadTestInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add question");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error && !testInfo) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/tests")}
            className="mt-4"
          >
            Back to Tests
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Add Questions: {testInfo?.title}
        </h2>
        <p className="text-gray-600">
          Add questions to modules. Select a module below to start.
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-green-700">{success}</p>
        </Card>
      )}

      {testInfo && testInfo.modules && testInfo.modules.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select Module
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testInfo.modules.map((module) => (
              <button
                key={module.moduleId}
                onClick={() => setSelectedModule(module)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedModule?.moduleId === module.moduleId
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-900">
                  {module.sectionType} - Module {module.moduleNumber}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Difficulty: {module.difficulty}
                </div>
                {module.questionCount && (
                  <div className="text-xs text-gray-500 mt-1">
                    {module.questionCount} questions needed
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {selectedModule && (
        <>
          {/* Existing Questions */}
          {selectedModule.questions && selectedModule.questions.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Existing Questions ({selectedModule.questions.length})
              </h3>
              <div className="space-y-2">
                {selectedModule.questions.map((question) => {
                  const isExpanded = expandedQuestions.has(question.id);
                  return (
                    <Card
                      key={question.id}
                      className="p-3 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">
                              Q{question.orderIndex + 1}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                question.difficulty === "EASY"
                                  ? "bg-green-100 text-green-700"
                                  : question.difficulty === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {question.difficulty}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                              {question.questionType === "MULTIPLE_CHOICE"
                                ? "MC"
                                : "Grid-in"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {question.questionText}
                          </p>
                          {isExpanded && (
                            <div className="mt-3 space-y-3 pt-3 border-t border-gray-200">
                              {question.passage && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    Passage:
                                  </p>
                                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                    {question.passage}
                                  </p>
                                </div>
                              )}
                              {question.contentDomain && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">
                                    Domain: {question.contentDomain}
                                  </p>
                                </div>
                              )}
                              {question.questionType === "MULTIPLE_CHOICE" &&
                                question.choices && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">
                                      Choices:
                                    </p>
                                    <div className="space-y-1">
                                      {question.choices
                                        .sort((a, b) => a.orderIndex - b.orderIndex)
                                        .map((choice) => (
                                          <div
                                            key={choice.id}
                                            className={`text-sm p-2 rounded ${
                                              choice.isCorrect
                                                ? "bg-green-50 border border-green-200 text-green-900"
                                                : "bg-gray-50 text-gray-700"
                                            }`}
                                          >
                                            {choice.isCorrect && (
                                              <span className="text-xs font-medium mr-2">
                                                ✓
                                              </span>
                                            )}
                                            {choice.choiceText}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              {question.questionType === "STUDENT_PRODUCED" &&
                                question.correctAnswer && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                      Correct Answer:
                                    </p>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                      {question.correctAnswer}
                                    </p>
                                  </div>
                                )}
                              {question.explanation && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    Explanation:
                                  </p>
                                  <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                                    {question.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setExpandedQuestions((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(question.id)) {
                                  newSet.delete(question.id);
                                } else {
                                  newSet.add(question.id);
                                }
                                return newSet;
                              });
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                !confirm(
                                  `Are you sure you want to delete question ${question.orderIndex + 1}?`
                                )
                              ) {
                                return;
                              }
                              try {
                                setSubmitting(true);
                                await adminTestService.deleteQuestion(
                                  selectedModule.moduleId,
                                  question.id
                                );
                                setSuccess("Question deleted successfully");
                                await loadTestInfo();
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete question"
                                );
                              } finally {
                                setSubmitting(false);
                              }
                            }}
                            className="text-red-400 hover:text-red-600"
                            disabled={submitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Add Question Form */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Question to: {selectedModule.sectionType} - Module{" "}
                {selectedModule.moduleNumber} ({selectedModule.difficulty})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFormExpanded(!isFormExpanded)}
              >
                {isFormExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            </div>

          {isFormExpanded && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="MULTIPLE_CHOICE"
                    checked={questionType === "MULTIPLE_CHOICE"}
                    onChange={(e) =>
                      setQuestionType(
                        e.target.value as
                          | "MULTIPLE_CHOICE"
                          | "STUDENT_PRODUCED"
                      )
                    }
                  />
                  <span>Multiple Choice</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="STUDENT_PRODUCED"
                    checked={questionType === "STUDENT_PRODUCED"}
                    onChange={(e) =>
                      setQuestionType(
                        e.target.value as
                          | "MULTIPLE_CHOICE"
                          | "STUDENT_PRODUCED"
                      )
                    }
                  />
                  <span>Student-Produced (Grid-in)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <div className="flex gap-4">
                {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                  <label key={diff} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={diff}
                      checked={difficulty === diff}
                      onChange={(e) =>
                        setDifficulty(
                          e.target.value as "EASY" | "MEDIUM" | "HARD"
                        )
                      }
                    />
                    <span>{diff}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentDomain">Content Domain (optional)</Label>
              <select
                id="contentDomain"
                value={contentDomain}
                onChange={(e) => setContentDomain(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={submitting}
              >
                <option value="">Select content domain...</option>
                {availableDomains.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passage">Passage (optional)</Label>
              <textarea
                id="passage"
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                placeholder="Reading passage text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionText">Question Text *</Label>
              <textarea
                id="questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter the question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
                required
                disabled={submitting}
              />
            </div>
          </div>
          )}

          {/* Collapsed view - show only essential fields */}
          {!isFormExpanded && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="MULTIPLE_CHOICE"
                        checked={questionType === "MULTIPLE_CHOICE"}
                        onChange={(e) =>
                          setQuestionType(
                            e.target.value as
                              | "MULTIPLE_CHOICE"
                              | "STUDENT_PRODUCED"
                          )
                        }
                      />
                      <span className="text-sm">Multiple Choice</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="STUDENT_PRODUCED"
                        checked={questionType === "STUDENT_PRODUCED"}
                        onChange={(e) =>
                          setQuestionType(
                            e.target.value as
                              | "MULTIPLE_CHOICE"
                              | "STUDENT_PRODUCED"
                          )
                        }
                      />
                      <span className="text-sm">Grid-in</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <div className="flex gap-4">
                    {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                      <label key={diff} className="flex items-center gap-2">
                        <input
                          type="radio"
                          value={diff}
                          checked={difficulty === diff}
                          onChange={(e) =>
                            setDifficulty(
                              e.target.value as "EASY" | "MEDIUM" | "HARD"
                            )
                          }
                        />
                        <span className="text-sm">{diff}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionTextCollapsed">Question Text *</Label>
                <textarea
                  id="questionTextCollapsed"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the question..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  required
                  disabled={submitting}
                />
              </div>

              {questionType === "MULTIPLE_CHOICE" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Choices *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddChoice}
                      disabled={submitting}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  {choices.map((choice, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={choice.text}
                        onChange={(e) =>
                          handleChoiceChange(index, "text", e.target.value)
                        }
                        placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                        disabled={submitting}
                        className="flex-1"
                      />
                      <label className="flex items-center gap-1 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={choice.isCorrect}
                          onChange={(e) =>
                            handleChoiceChange(
                              index,
                              "isCorrect",
                              e.target.checked
                            )
                          }
                          disabled={submitting}
                          className="w-4 h-4"
                        />
                        <span className="text-xs">Correct</span>
                      </label>
                      {choices.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveChoice(index)}
                          disabled={submitting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {questionType === "STUDENT_PRODUCED" && (
                <div className="space-y-2">
                  <Label htmlFor="correctAnswerCollapsed">Correct Answer *</Label>
                  <Input
                    id="correctAnswerCollapsed"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder="e.g., 4, 3/4, 0.75"
                    required
                    disabled={submitting}
                  />
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Button onClick={handleSubmitQuestion} disabled={submitting} className="flex-1">
                  {submitting ? "Adding..." : "Add Question"}
                </Button>
              </div>
            </div>
          )}
        </Card>
        </>
      )}

      {testInfo && (!testInfo.modules || testInfo.modules.length === 0) && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Modules Found
              </h3>
              <p className="text-gray-600">
                This test doesn&apos;t have any modules. Please check if the test was created correctly.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/tests")}
            >
              Back to Tests
            </Button>
          </div>
        </Card>
      )}

      {testInfo && testInfo.modules && testInfo.modules.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Test Validation
            </h3>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const validation = await adminTestService.validateTest(
                    testId
                  );
                  if (validation.isValid) {
                    setSuccess("Test is complete and ready for students!");
                  } else {
                    setError(
                      `Test incomplete: ${validation.issues.join(", ")}`
                    );
                  }
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to validate test"
                  );
                }
              }}
            >
              Validate Test
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}


