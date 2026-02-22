"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  useAdminTestById,
  useAdminTestInvalidate,
} from "@/src/hooks/use-admin-tests";
import { ChevronDown, ChevronUp } from "lucide-react";

const QUESTIONS_PER_MODULE = { ENGLISH: 27, MATH: 22 } as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/gif,image/webp,image/svg+xml";
const TOTAL_SAT_QUESTIONS = 98;

const ENGLISH_DOMAINS = [
  { value: "", label: "—" },
  { value: "INFORMATION_AND_IDEAS", label: "Information and Ideas" },
  { value: "CRAFT_AND_STRUCTURE", label: "Craft and Structure" },
  { value: "EXPRESSION_OF_IDEAS", label: "Expression of Ideas" },
  {
    value: "STANDARD_ENGLISH_CONVENTIONS",
    label: "Standard English Conventions",
  },
];

const MATH_DOMAINS = [
  { value: "", label: "—" },
  { value: "ALGEBRA", label: "Algebra" },
  { value: "ADVANCED_MATH", label: "Advanced Math" },
  { value: "PROBLEM_SOLVING_DATA", label: "Problem Solving and Data Analysis" },
  { value: "GEOMETRY_TRIGONOMETRY", label: "Geometry and Trigonometry" },
];

interface Module {
  moduleId: string;
  sectionType: "ENGLISH" | "MATH";
  moduleNumber: number;
  difficulty: "EASY" | "HARD";
  questionCount?: number;
}

interface TestInfo {
  id: string;
  title: string;
  modules: Module[];
}

type VariantKind = "text" | "image";

interface QuestionSlot {
  questionId?: string;
  questionText: string;
  passage: string;
  imageUrl?: string;
  questionType?: "MULTIPLE_CHOICE" | "STUDENT_PRODUCED";
  /** Barcha variantlar bir xil: faqat matn yoki faqat rasm */
  choicesKind?: VariantKind;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  choiceAVariant?: VariantKind;
  choiceBVariant?: VariantKind;
  choiceCVariant?: VariantKind;
  choiceDVariant?: VariantKind;
  choiceAImageUrl?: string;
  choiceBImageUrl?: string;
  choiceCImageUrl?: string;
  choiceDImageUrl?: string;
  correct: 0 | 1 | 2 | 3;
  correctAnswer?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  contentDomain: string;
}

function emptySlot(): QuestionSlot {
  return {
    questionText: "",
    passage: "",
    imageUrl: "",
    questionType: "MULTIPLE_CHOICE",
    choicesKind: "text",
    choiceA: "",
    choiceB: "",
    choiceC: "",
    choiceD: "",
    choiceAVariant: "text",
    choiceBVariant: "text",
    choiceCVariant: "text",
    choiceDVariant: "text",
    correct: 0,
    correctAnswer: "",
    difficulty: "EASY",
    contentDomain: "",
  };
}

/** Backend savol obyektini form slot ga aylantiradi (tahrirlashda ishlatiladi) */
function apiQuestionToSlot(q: {
  id?: string;
  questionText?: string;
  imageUrl?: string;
  passage?: string;
  questionType?: string;
  choices?: Array<{
    choiceText?: string;
    imageUrl?: string;
    isCorrect?: boolean;
    orderIndex?: number;
  }>;
  correctAnswer?: string;
  difficulty?: string;
  contentDomain?: string;
}): QuestionSlot {
  const choices = q.choices ?? [];
  const correctIndex = choices.findIndex((c) => c.isCorrect);
  const correct = (correctIndex >= 0 ? correctIndex : 0) as 0 | 1 | 2 | 3;
  const c0 = choices[0];
  const c1 = choices[1];
  const c2 = choices[2];
  const c3 = choices[3];
  const hasImg = (c: { imageUrl?: string } | undefined) =>
    !!(c?.imageUrl && String(c.imageUrl).trim());
  const kind: VariantKind =
    hasImg(c0) || hasImg(c1) || hasImg(c2) || hasImg(c3) ? "image" : "text";
  return {
    questionId: q.id,
    questionText: q.questionText ?? "",
    passage: q.passage ?? "",
    imageUrl: (q.imageUrl ?? "").trim() || undefined,
    questionType:
      q.questionType === "STUDENT_PRODUCED"
        ? "STUDENT_PRODUCED"
        : "MULTIPLE_CHOICE",
    choicesKind: kind,
    choiceA: c0?.choiceText ?? "",
    choiceB: c1?.choiceText ?? "",
    choiceC: c2?.choiceText ?? "",
    choiceD: c3?.choiceText ?? "",
    choiceAVariant: kind,
    choiceBVariant: kind,
    choiceCVariant: kind,
    choiceDVariant: kind,
    choiceAImageUrl: c0?.imageUrl?.trim() || undefined,
    choiceBImageUrl: c1?.imageUrl?.trim() || undefined,
    choiceCImageUrl: c2?.imageUrl?.trim() || undefined,
    choiceDImageUrl: c3?.imageUrl?.trim() || undefined,
    correct,
    correctAnswer: q.correctAnswer ?? "",
    difficulty:
      q.difficulty === "MEDIUM" || q.difficulty === "HARD"
        ? q.difficulty
        : "EASY",
    contentDomain: q.contentDomain ?? "",
  };
}

/** Rasmlar base64 (data:...) bo‘lsa backend GCS ga yuklaydi (IMAGE_UPLOAD_API.md Method 1) */
function slotToQuestionInput(
  slot: QuestionSlot,
  orderIndex: number,
): QuestionInput {
  const questionText = (slot.questionText ?? "").trim();
  const questionImage = (slot.imageUrl ?? "").trim() || undefined;
  const isBase64 = questionImage?.startsWith("data:");
  const base = {
    questionText,
    questionType: slot.questionType ?? "MULTIPLE_CHOICE",
    orderIndex,
    difficulty: slot.difficulty ?? "EASY",
    passage: (slot.passage ?? "").trim() || undefined,
    ...(isBase64
      ? { imageBase64: questionImage }
      : questionImage
        ? { imageUrl: questionImage }
        : {}),
    contentDomain: (slot.contentDomain ?? "").trim() || undefined,
  };

  if (slot.questionType === "STUDENT_PRODUCED") {
    return {
      ...base,
      correctAnswer: (slot.correctAnswer ?? "").trim() || undefined,
    };
  }

  const letters = ["A", "B", "C", "D"] as const;
  const choiceTexts = [
    slot.choiceA ?? "",
    slot.choiceB ?? "",
    slot.choiceC ?? "",
    slot.choiceD ?? "",
  ];
  const choiceVariants: VariantKind[] = [
    slot.choiceAVariant ?? "text",
    slot.choiceBVariant ?? "text",
    slot.choiceCVariant ?? "text",
    slot.choiceDVariant ?? "text",
  ];
  const choiceUrls = [
    slot.choiceAImageUrl,
    slot.choiceBImageUrl,
    slot.choiceCImageUrl,
    slot.choiceDImageUrl,
  ];
  const choices = [0, 1, 2, 3].map((c) => {
    const kind = choiceVariants[c];
    const text = (choiceTexts[c] ?? "").trim();
    const url = (choiceUrls[c] ?? "").trim() || undefined;
    const hasImage = !!url;
    const choiceText = text || letters[c];
    const isChoiceBase64 = url?.startsWith("data:");
    return {
      choiceText: choiceText || letters[c],
      isCorrect: slot.correct === c,
      orderIndex: c,
      ...(hasImage
        ? isChoiceBase64
          ? { imageBase64: url }
          : { imageUrl: url }
        : {}),
    };
  });
  const withContent = choices.filter(
    (c, i) => (c.choiceText ?? "").trim() || (choiceUrls[i] ?? "").trim(),
  );
  return {
    ...base,
    choices:
      withContent.length >= 2
        ? withContent
        : [
            { choiceText: "A", isCorrect: true, orderIndex: 0 },
            { choiceText: "B", isCorrect: false, orderIndex: 1 },
          ],
  };
}

/** PATCH uchun ham: yangi rasm base64, mavjud rasm imageUrl (IMAGE_UPLOAD_API.md) */
function slotToQuestionInputForUpdate(
  slot: QuestionSlot,
  orderIndex: number,
): QuestionInput {
  const questionText = (slot.questionText ?? "").trim();
  const questionImage = (slot.imageUrl ?? "").trim() || undefined;
  const isBase64 = questionImage?.startsWith("data:");
  const base = {
    questionText,
    questionType: slot.questionType ?? "MULTIPLE_CHOICE",
    orderIndex,
    difficulty: slot.difficulty ?? "EASY",
    passage: (slot.passage ?? "").trim() || undefined,
    ...(questionImage
      ? isBase64
        ? { imageBase64: questionImage }
        : { imageUrl: questionImage }
      : {}),
    contentDomain: (slot.contentDomain ?? "").trim() || undefined,
  };

  if (slot.questionType === "STUDENT_PRODUCED") {
    return {
      ...base,
      correctAnswer: (slot.correctAnswer ?? "").trim() || undefined,
    };
  }

  const letters = ["A", "B", "C", "D"] as const;
  const choiceTexts = [
    slot.choiceA ?? "",
    slot.choiceB ?? "",
    slot.choiceC ?? "",
    slot.choiceD ?? "",
  ];
  const choiceUrls = [
    slot.choiceAImageUrl,
    slot.choiceBImageUrl,
    slot.choiceCImageUrl,
    slot.choiceDImageUrl,
  ];
  const choices = [0, 1, 2, 3].map((c) => {
    const text = (choiceTexts[c] ?? "").trim();
    const url = (choiceUrls[c] ?? "").trim() || undefined;
    const choiceIsBase64 = url?.startsWith("data:");
    return {
      choiceText: text || letters[c],
      isCorrect: slot.correct === c,
      orderIndex: c,
      ...(url
        ? choiceIsBase64
          ? { imageBase64: url }
          : { imageUrl: url }
        : {}),
    };
  });
  const withContent = choices.filter(
    (c, i) => (c.choiceText ?? "").trim() || (choiceUrls[i] ?? "").trim(),
  );
  return {
    ...base,
    choices:
      withContent.length >= 2
        ? withContent
        : [
            { choiceText: "A", isCorrect: true, orderIndex: 0 },
            { choiceText: "B", isCorrect: false, orderIndex: 1 },
          ],
  };
}

export default function TestQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const [drafts, setDrafts] = useState<Record<string, QuestionSlot[]>>({});
  const [savingSlotKey, setSavingSlotKey] = useState<string | null>(null);

  const {
    data: test,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useAdminTestById(testId);
  const { invalidateTest } = useAdminTestInvalidate();

  useEffect(() => {
    if (!testId || !test) return;
    let modules: Module[] = [];
    if (test?.modules?.length) {
      modules = test.modules.map((m: any) => ({
        moduleId: m.moduleId || m.id,
        sectionType: m.sectionType,
        moduleNumber: m.moduleNumber,
        difficulty: m.difficulty || "EASY",
        questionCount: m.questionCount,
      }));
    } else if (test?.sections?.length) {
      for (const s of test.sections) {
        for (const m of s.modules ?? []) {
          modules.push({
            moduleId: m.id || m.moduleId,
            sectionType: s.sectionType || m.sectionType,
            moduleNumber: m.moduleNumber,
            difficulty: m.difficulty || "EASY",
            questionCount: m.questionCount,
          });
        }
      }
    }
    if (modules.length === 0) {
      setError("Modullar topilmadi.");
      return;
    }
    setError("");
    setTestInfo({ id: test.id, title: test.title, modules });
    setSelectedModule((prev) => prev ?? modules[0]);
    const next: Record<string, QuestionSlot[]> = {};
    const moduleSources =
      test?.modules?.length > 0
        ? test.modules
        : (test?.sections ?? []).flatMap((s: any) => s.modules ?? []);
    for (let idx = 0; idx < modules.length; idx++) {
      const m = modules[idx];
      const raw = moduleSources[idx];
      const questions: any[] = raw?.questions ?? [];
      const count = QUESTIONS_PER_MODULE[m.sectionType] ?? 27;
      const slots: QuestionSlot[] = Array.from({ length: count }, () =>
        emptySlot(),
      );
      (questions ?? []).forEach((q: Record<string, unknown>) => {
        const orderIndex =
          typeof (q as { orderIndex?: number }).orderIndex === "number"
            ? (q as { orderIndex: number }).orderIndex
            : 0;
        if (orderIndex >= 0 && orderIndex < count) {
          slots[orderIndex] = apiQuestionToSlot(q as Parameters<typeof apiQuestionToSlot>[0]);
        }
      });
      next[m.moduleId] = slots;
    }
    setDrafts(next);
  }, [testId, test]);

  const updateSlot = (
    moduleId: string,
    index: number,
    patch: Partial<QuestionSlot>,
  ) => {
    setDrafts((prev) => {
      const list = [...(prev[moduleId] ?? [])];
      list[index] = { ...list[index], ...patch };
      return { ...prev, [moduleId]: list };
    });
  };

  const payload = useMemo(() => {
    if (!testInfo?.modules?.length) return null;
    const modules: { moduleId: string; questions: QuestionInput[] }[] = [];
    for (const m of testInfo.modules) {
      const mid = m.moduleId;
      const list = drafts[mid] ?? [];
      // orderIndex = slot index (0..26/22) so tartib raqami almashmasin
      const questions = list
        .map((slot, index) => ({ slot, index }))
        .filter(
          ({ slot }) =>
            !slot.questionId && (slot.questionText ?? "").trim().length > 0,
        )
        .map(({ slot, index }) => slotToQuestionInput(slot, index));
      if (questions.length > 0) modules.push({ moduleId: mid, questions });
    }
    return modules.length > 0 ? { modules } : null;
  }, [testInfo, drafts]);

  const totalFilled = useMemo(() => {
    return Object.values(drafts).reduce(
      (s, arr) =>
        s + arr.filter((q) => (q.questionText ?? "").trim().length > 0).length,
      0,
    );
  }, [drafts]);

  const [submitProgress, setSubmitProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const handleSubmit = async () => {
    if (!payload?.modules?.length) {
      setError("Kamida bitta savol matnini kiriting va Yuborish bosing.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    setSubmitProgress(null);
    const totalToSend = payload.modules.reduce(
      (s, m) => s + m.questions.length,
      0,
    );
    let sent = 0;
    try {
      // Bulk: bitta so'rovda barcha savollarni yuborish — 429 va Too Many Request bo'lmasin
      setSubmitProgress({ current: 0, total: totalToSend });
      const result = await adminTestService.submitAllQuestions(testId, payload);
      sent = result?.totalAdded ?? totalToSend;
      setSubmitProgress({ current: sent, total: totalToSend });
      setSuccess(
        sent === 1
          ? "1 ta savol qo'shildi. Rasm backend (GCS) da saqlanadi — barcha qurilmalarda ko'rinadi."
          : `${sent} ta savol qo'shildi. Rasmlar backend da saqlanadi — barcha qurilmalarda ko'rinadi.`,
      );
      invalidateTest(testId);
      void refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Saqlash xatosi";
      const isBulkUnavailable =
        msg.includes("Bulk add failed") ||
        msg.includes("404") ||
        msg.includes("Not Found");
      if (isBulkUnavailable && totalToSend > 0) {
        // Fallback: 1 ta 1 ta yuborish, lekin batch va delay bilan (429 kamayadi)
        const BATCH_SIZE = 5;
        const DELAY_MS = 400;
        try {
          for (const mod of payload.modules) {
            const { moduleId, questions } = mod;
            for (let i = 0; i < questions.length; i++) {
              setSubmitProgress({ current: sent + 1, total: totalToSend });
              await adminTestService.addQuestionToModule(moduleId, questions[i]);
              sent++;
              if (sent < totalToSend && sent % BATCH_SIZE === 0) {
                await new Promise((r) => setTimeout(r, DELAY_MS));
              }
            }
          }
          setSuccess(
            sent === 1
              ? "1 ta savol qo'shildi."
              : `${sent} ta savol qo'shildi.`,
          );
          invalidateTest(testId);
          void refetch();
        } catch (fallbackErr) {
          const fallbackMsg =
            fallbackErr instanceof Error ? fallbackErr.message : "Saqlash xatosi";
          setError(
            sent > 0
              ? `${sent} ta saqlandi. Keyingi savol xato: ${fallbackMsg}`
              : fallbackMsg,
          );
        }
      } else {
        const isStorage500 =
          msg.includes("upload image to storage") ||
          msg.includes("500") ||
          msg.includes("Failed to upload");
        const hint = isStorage500
          ? " Backend (GCS) sozlamalarini va loglarni tekshiring — api.satziyo.uz."
          : "";
        setError(
          sent > 0
            ? `${sent} ta saqlandi. Keyingi savol xato: ${msg}${hint}`
            : `${msg}${hint}`,
        );
      }
    } finally {
      setSubmitting(false);
      setSubmitProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if ((queryError || error) && !testInfo) {
    return (
      <div className="p-6">
        <p className="text-red-700">
          {(queryError as Error)?.message ?? error}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/tests")}
        >
          Testlar
        </Button>
      </div>
    );
  }

  const domains =
    selectedModule?.sectionType === "MATH" ? MATH_DOMAINS : ENGLISH_DOMAINS;

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {testInfo?.title}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Modulni tanlang, savollarni to‘ldiring va pastda <strong>Yuborish</strong> bosing.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/tests")}
          className="gap-1.5"
        >
          ← Testlar
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <Card className="p-4 rounded-xl border-gray-200 shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-3">Modul</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {testInfo?.modules?.map((module) => {
            const mid = module.moduleId;
            const count =
              QUESTIONS_PER_MODULE[module.sectionType] ?? 27;
            const filled = (drafts[mid] ?? []).filter(
              (q) => (q.questionText ?? "").trim().length > 0,
            ).length;
            const isSelected = selectedModule?.moduleId === mid;
            return (
              <button
                key={mid}
                type="button"
                onClick={() => {
                  setSelectedModule(module);
                  setExpandedQuestion(null);
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-orange-500 bg-orange-50 text-orange-900"
                    : "border-gray-200 hover:border-gray-300 bg-white text-gray-800"
                }`}
              >
                <p className="font-semibold text-sm">
                  {module.sectionType} {module.moduleNumber}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {filled} / {count}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedModule && (
        <Card className="p-4 rounded-xl border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-semibold text-gray-900">
              {selectedModule.sectionType} Module {selectedModule.moduleNumber} — savollar
            </h3>
          </div>
          {selectedModule.sectionType === "MATH" && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <p className="font-medium mb-1">Math:</p>
              <p>Grid-in uchun to‘g‘ri javobni son/kasr yozing (mas: 4, 3/4, 0.75). Variantli bo‘lsa A–D to‘ldiring va to‘g‘ri javobni belgilang.</p>
            </div>
          )}
          <div className="space-y-2">
            {Array.from(
              {
                length:
                  QUESTIONS_PER_MODULE[selectedModule.sectionType] ?? 27,
              },
              (_, i) => {
                const mid = selectedModule.moduleId;
                const slot = (drafts[mid] ?? [])[i] ?? emptySlot();
                const isExpanded = expandedQuestion === i;
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedQuestion(isExpanded ? null : i)}
                    >
                      <span className="font-medium text-gray-800">
                        {i + 1}.
                        {slot.questionId && (
                          <span className="ml-1 text-xs font-normal text-blue-600">
                            (saqlangan)
                          </span>
                        )}
                      </span>
                      {(slot.questionText ?? "").trim() ? (
                        <span className="text-xs text-gray-600 truncate max-w-[220px]">
                          {(slot.questionText ?? "").slice(0, 45)}…
                          {slot.questionType === "STUDENT_PRODUCED" && (
                            <span className="ml-1 text-gray-400">(grid-in)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Bo‘sh</span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-3 bg-white border-t border-gray-100">
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Savol matni *</Label>
                          <textarea
                            placeholder={
                              selectedModule.sectionType === "MATH"
                                ? "Savol matni (mas: 2x+3=7 bo‘lsa x=?)"
                                : "Savol matnini yozing"
                            }
                            value={slot.questionText ?? ""}
                            onChange={(e) =>
                              updateSlot(mid, i, {
                                questionText: e.target.value,
                              })
                            }
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Savol rasmi (ixtiyoriy)</Label>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <label className="cursor-pointer text-xs text-orange-600 hover:underline font-medium">
                              Rasm tanlang
                              <input
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES}
                                className="hidden"
                                key={`q-img-${mid}-${i}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > MAX_IMAGE_SIZE) {
                                    setError("Rasm 5MB dan oshmasin.");
                                    return;
                                  }
                                  setError("");
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const dataUrl = reader.result as string;
                                    if (dataUrl)
                                      updateSlot(mid, i, { imageUrl: dataUrl });
                                  };
                                  reader.readAsDataURL(file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <span className="text-xs text-gray-400">
                              JPEG, PNG, GIF, WebP, SVG — max 5MB
                            </span>
                          </div>
                          {(slot.imageUrl ?? "").trim() && (
                            <img
                              src={(slot.imageUrl ?? "").trim()}
                              alt="Savol rasmi"
                              className="mt-2 max-h-12 rounded border object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">
                            {selectedModule.sectionType === "MATH"
                              ? "Qo'shimcha matn / vaziya (ixtiyoriy)"
                              : "Passage (ixtiyoriy, Reading uchun)"}
                          </Label>
                          <textarea
                            placeholder={
                              selectedModule.sectionType === "MATH"
                                ? "Qisqa vaziya yoki formula (Math uchun)"
                                : "Paragraf matni"
                            }
                            value={slot.passage ?? ""}
                            onChange={(e) =>
                              updateSlot(mid, i, { passage: e.target.value })
                            }
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[60px]"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Savol turi</Label>
                          <div className="flex gap-4 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`${mid}-${i}-type`}
                                checked={
                                  (slot.questionType ?? "MULTIPLE_CHOICE") ===
                                  "MULTIPLE_CHOICE"
                                }
                                onChange={() =>
                                  updateSlot(mid, i, {
                                    questionType: "MULTIPLE_CHOICE",
                                  })
                                }
                              />
                              <span className="text-sm">
                                Variantli (A, B, C, D)
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`${mid}-${i}-type`}
                                checked={
                                  (slot.questionType ?? "MULTIPLE_CHOICE") ===
                                  "STUDENT_PRODUCED"
                                }
                                onChange={() =>
                                  updateSlot(mid, i, {
                                    questionType: "STUDENT_PRODUCED",
                                  })
                                }
                              />
                              <span className="text-sm">
                                Grid-in / yopiq (Math: to&apos;g&apos;ri javob
                                yoziladi)
                              </span>
                            </label>
                          </div>
                        </div>

                        {slot.questionType === "STUDENT_PRODUCED" ? (
                          <div>
                            <Label className="text-xs">
                              To&apos;g&apos;ri javob * (son yoki kasr, masalan
                              4, 3/4, 0.75)
                            </Label>
                            <Input
                              placeholder={
                                selectedModule.sectionType === "MATH"
                                  ? "4, 3/4, 0.75, -2, 4.5 — SAT grid-in qabul qiladi"
                                  : "4 yoki 3/4 yoki 0.75"
                              }
                              value={slot.correctAnswer ?? ""}
                              onChange={(e) =>
                                updateSlot(mid, i, {
                                  correctAnswer: e.target.value,
                                })
                              }
                              className="mt-1 text-sm max-w-xs"
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <Label className="text-xs">
                                Barcha variantlar:
                              </Label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className={`text-xs px-3 py-1.5 rounded ${
                                    (slot.choicesKind ??
                                      slot.choiceAVariant ??
                                      "text") === "text"
                                      ? "bg-orange-600 text-white"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                  onClick={() =>
                                    updateSlot(mid, i, {
                                      choicesKind: "text",
                                      choiceAVariant: "text",
                                      choiceBVariant: "text",
                                      choiceCVariant: "text",
                                      choiceDVariant: "text",
                                    })
                                  }
                                >
                                  Faqat matn
                                </button>
                                <button
                                  type="button"
                                  className={`text-xs px-3 py-1.5 rounded ${
                                    (slot.choicesKind ??
                                      slot.choiceAVariant ??
                                      "text") === "image"
                                      ? "bg-orange-600 text-white"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                  onClick={() =>
                                    updateSlot(mid, i, {
                                      choicesKind: "image",
                                      choiceAVariant: "image",
                                      choiceBVariant: "image",
                                      choiceCVariant: "image",
                                      choiceDVariant: "image",
                                    })
                                  }
                                >
                                  Faqat rasm
                                </button>
                              </div>
                              <span className="text-xs text-gray-500">
                                (barcha A, B, C, D bir xil turda)
                              </span>
                            </div>
                            {(["A", "B", "C", "D"] as const).map(
                              (letter, c) => {
                                const textKey =
                                  `choice${letter}` as keyof QuestionSlot as
                                    | "choiceA"
                                    | "choiceB"
                                    | "choiceC"
                                    | "choiceD";
                                const imageUrlKey =
                                  `choice${letter}ImageUrl` as keyof QuestionSlot as
                                    | "choiceAImageUrl"
                                    | "choiceBImageUrl"
                                    | "choiceCImageUrl"
                                    | "choiceDImageUrl";
                                const kind = (slot.choicesKind ??
                                  slot.choiceAVariant ??
                                  "text") as VariantKind;
                                const textVal = (slot[textKey] ?? "") as string;
                                const imgUrl = (slot[imageUrlKey] ??
                                  "") as string;
                                return (
                                  <div
                                    key={`${mid}-${i}-var-${letter}`}
                                    className="rounded border border-gray-200 p-3 space-y-2 bg-gray-50/50"
                                  >
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-medium w-5">
                                        {letter}
                                      </span>
                                      <input
                                        type="radio"
                                        name={`${mid}-${i}-correct`}
                                        checked={slot.correct === c}
                                        onChange={() =>
                                          updateSlot(mid, i, {
                                            correct: c as 0 | 1 | 2 | 3,
                                          })
                                        }
                                        title="To'g'ri javob"
                                        className="ml-auto"
                                      />
                                    </div>
                                    {kind === "text" ? (
                                      <Input
                                        placeholder={`Javob ${letter} (matn)`}
                                        value={textVal}
                                        onChange={(e) =>
                                          updateSlot(mid, i, {
                                            [textKey]: e.target.value,
                                          })
                                        }
                                        className="text-sm"
                                      />
                                    ) : (
                                      <div className="space-y-2">
                                        <Input
                                          placeholder={`Label (ixtiyoriy, masalan Graph ${letter})`}
                                          value={textVal}
                                          onChange={(e) =>
                                            updateSlot(mid, i, {
                                              [textKey]: e.target.value,
                                            })
                                          }
                                          className="text-sm max-w-[200px]"
                                        />
                                        <label className="cursor-pointer text-xs text-orange-600 hover:underline">
                                          Rasm yuklash
                                          <input
                                            type="file"
                                            accept={ACCEPTED_IMAGE_TYPES}
                                            className="hidden"
                                            key={`${mid}-${i}-choice-${letter}`}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              if (file.size > MAX_IMAGE_SIZE) {
                                                setError(
                                                  "Rasm 5MB dan oshmasin.",
                                                );
                                                return;
                                              }
                                              setError("");
                                              const reader = new FileReader();
                                              reader.onload = () => {
                                                const dataUrl =
                                                  reader.result as string;
                                                if (dataUrl)
                                                  updateSlot(mid, i, {
                                                    [imageUrlKey]: dataUrl,
                                                  });
                                              };
                                              reader.readAsDataURL(file);
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>
                                        {imgUrl.trim() && (
                                          <img
                                            src={imgUrl}
                                            alt={`Variant ${letter}`}
                                            className="max-h-12 rounded border object-contain"
                                            onError={(ev) => {
                                              (
                                                ev.target as HTMLImageElement
                                              ).style.display = "none";
                                            }}
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4">
                          <div>
                            <Label className="text-xs">Difficulty</Label>
                            <select
                              value={slot.difficulty}
                              onChange={(e) =>
                                updateSlot(mid, i, {
                                  difficulty: e.target
                                    .value as QuestionSlot["difficulty"],
                                })
                              }
                              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="EASY">EASY</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="HARD">HARD</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Content domain</Label>
                            <select
                              value={slot.contentDomain}
                              onChange={(e) =>
                                updateSlot(mid, i, {
                                  contentDomain: e.target.value,
                                })
                              }
                              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm min-w-[180px]"
                            >
                              {domains.map((d) => (
                                <option key={d.value} value={d.value}>
                                  {d.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {slot.questionId && (
                          <div className="pt-2 border-t border-gray-100">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                savingSlotKey === `${mid}-${i}` ||
                                !(slot.questionText ?? "").trim()
                              }
                              onClick={async () => {
                                if (!slot.questionId) return;
                                setSavingSlotKey(`${mid}-${i}`);
                                setError("");
                                setSuccess("");
                                try {
                                  await adminTestService.updateQuestion(
                                    mid,
                                    slot.questionId,
                                    slotToQuestionInputForUpdate(slot, i),
                                  );
                                  setSuccess("Savol tahrirlandi, saqlandi.");
                                } catch (e) {
                                  const msg =
                                    e instanceof Error
                                      ? e.message
                                      : "Saqlash xatosi";
                                  const isAnswered =
                                    /answered|cannot update question|tahrirlab bo'lmaydi/i.test(
                                      msg
                                    );
                                  const isStorage500 =
                                    msg.includes("upload image to storage") ||
                                    msg.includes("500") ||
                                    msg.includes("Failed to upload");
                                  let displayMsg = msg;
                                  if (isAnswered) {
                                    displayMsg =
                                      "Bu savol allaqachon talabalar tomonidan javob berilgan. Natijalarni saqlash uchun tahrirlashga ruxsat berilmaydi. O'zgartirish kerak bo'lsa, yangi savol qo'shing (bo'sh slotdan foydalaning).";
                                  } else if (isStorage500) {
                                    displayMsg += " Backend (GCS) sozlamalarini tekshiring.";
                                  }
                                  setError(displayMsg);
                                } finally {
                                  setSavingSlotKey(null);
                                }
                              }}
                            >
                              {savingSlotKey === `${mid}-${i}`
                                ? "Saqlanmoqda…"
                                : "Saqlash"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </Card>
      )}

      <div className="sticky bottom-4 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !(payload?.modules?.length ?? 0)}
          className="bg-orange-600 hover:bg-orange-700 px-8"
        >
          {submitting
            ? submitProgress
              ? `Yuborilmoqda (${submitProgress.current}/${submitProgress.total})...`
              : "Qo'shilmoqda..."
            : `Yuborish (${totalFilled}/${TOTAL_SAT_QUESTIONS})`}
        </Button>
      </div>
    </div>
  );
}
