"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  Question,
  isOpenAnswerQuestion,
  hasChoiceOptions,
  getQuestionImageUrl,
  getChoiceText,
  getChoiceImageUrl,
} from "@/src/services/practice.service";
import { MarkdownRenderer } from "@/src/components/markdown/MarkdownRenderer";
import { MarkdownWithCharHighlights } from "@/src/components/practice/markdownWithCharHighlights";

type HighlightStyle =
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "underline"
  | "dotted"
  | "bold"
  | "italic";

interface QuestionDisplayProps {
  question: Question;
  selectedChoiceId?: string;
  textAnswer?: string;
  onSelectChoice: (choiceId: string) => void;
  onTextAnswerChange: (text: string) => void;
  isFlagged?: boolean;
  hidePassage?: boolean;
  isMarkupEnabled?: boolean;
  showOnlyQuestionText?: boolean;
  attemptId?: string; // For saving highlights in test page format
  onHighlightsChange?: (
    highlights: Array<{
      startOffset: number;
      endOffset: number;
      color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
      note?: string | null;
    }>,
  ) => void; // Callback when highlights change
}

/**
 * Question Display Component
 * Renders question with choices or text input
 */
export function QuestionDisplay({
  question,
  selectedChoiceId,
  textAnswer,
  onSelectChoice,
  onTextAnswerChange,
  isFlagged = false,
  hidePassage = false,
  isMarkupEnabled = false,
  showOnlyQuestionText = false,
  attemptId,
  onHighlightsChange,
}: QuestionDisplayProps) {
  // Text highlight state: map of character index -> array of styles (so you can combine e.g. yellow + bold + italic)
  const [selectedStyle, setSelectedStyle] = useState<HighlightStyle>("yellow");
  const [highlights, setHighlights] = useState<Record<number, HighlightStyle[]>>(
    {},
  );
  const textRef = useRef<HTMLDivElement | null>(null);
  /** Mount / savol almashguncha bo‘sh highlights bilan parentga [] yuborilmasin — LS dagi eski highlight o‘chib ketmasin */
  const highlightParentSyncReadyRef = useRef(false);
  /** Shu mountda savol matnida highlight bo‘lgan — bo‘sh [] faqat o‘chirishni haqiqatan istaganda parentga */
  const sessionHadQuestionTextBackendRef = useRef(false);
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;
  const onHighlightsChangeRef = useRef(onHighlightsChange);
  onHighlightsChangeRef.current = onHighlightsChange;

  // Use test page storage key if attemptId is provided, otherwise use question-specific key
  const storageKey = useMemo(
    () =>
      attemptId
        ? `test_highlights_${attemptId}`
        : `sat-question-highlights-${question.id}`,
    [question.id, attemptId],
  );

  // Convert highlights from character index format to startOffset/endOffset format
  const convertHighlightsToBackendFormat = useCallback(
    (
      highlights: Record<number, HighlightStyle[]>,
    ): Array<{
      startOffset: number;
      endOffset: number;
      color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
      note?: string | null;
    }> => {
      if (Object.keys(highlights).length === 0) return [];

      const colorStyles: HighlightStyle[] = ["yellow", "green", "blue", "pink"];
      const getPrimaryColor = (styles: HighlightStyle[]) => {
        const c = styles.find((s) => colorStyles.includes(s));
        return c || "yellow";
      };

      const sortedIndices = Object.keys(highlights)
        .map(Number)
        .sort((a, b) => a - b);
      const ranges: Array<{
        start: number;
        end: number;
        styles: HighlightStyle[];
      }> = [];

      if (sortedIndices.length === 0) return [];

      let currentStart = sortedIndices[0];
      let currentEnd = sortedIndices[0];
      let currentStyles = highlights[sortedIndices[0]] || [];

      for (let i = 1; i < sortedIndices.length; i++) {
        const idx = sortedIndices[i];
        const styles = highlights[idx] || [];
        const sameStyles =
          currentStyles.length === styles.length &&
          currentStyles.every((s, j) => styles[j] === s);

        if (idx === currentEnd + 1 && sameStyles) {
          currentEnd = idx;
        } else {
          ranges.push({
            start: currentStart,
            end: currentEnd,
            styles: currentStyles,
          });
          currentStart = idx;
          currentEnd = idx;
          currentStyles = styles;
        }
      }

      ranges.push({
        start: currentStart,
        end: currentEnd,
        styles: currentStyles,
      });

      const colorMap: Record<
        HighlightStyle,
        "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE"
      > = {
        yellow: "YELLOW",
        green: "GREEN",
        blue: "BLUE",
        pink: "PINK",
        underline: "YELLOW",
        dotted: "YELLOW",
        bold: "YELLOW",
        italic: "YELLOW",
      };

      return ranges.map((range) => ({
        startOffset: range.start,
        endOffset: range.end + 1,
        color: colorMap[getPrimaryColor(range.styles)] || "YELLOW",
        note: null,
      }));
    },
    [],
  );

  useEffect(() => {
    highlightParentSyncReadyRef.current = false;
    sessionHadQuestionTextBackendRef.current = false;

    let nextHighlights: Record<number, HighlightStyle[]> = {};

    if (typeof window !== "undefined") {
      if (attemptId) {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const allHighlights = JSON.parse(raw) as Record<
              string,
              Array<{
                startOffset: number;
                endOffset: number;
                color: string;
              }>
            >;
            const qKey = String(question.id);
            const questionHighlights = allHighlights[qKey] || [];
            questionHighlights.forEach((h) => {
              const colorMap: Record<string, HighlightStyle> = {
                YELLOW: "yellow",
                GREEN: "green",
                BLUE: "blue",
                PINK: "pink",
                ORANGE: "yellow",
              };
              const style = colorMap[h.color] || "yellow";
              for (let i = h.startOffset; i < h.endOffset; i++) {
                nextHighlights[i] = [style];
              }
            });
          }
        } catch {
          // ignore
        }
      } else {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw) as Record<
              string,
              HighlightStyle | HighlightStyle[]
            >;
            Object.entries(parsed || {}).forEach(([k, v]) => {
              const idx = Number(k);
              if (Array.isArray(v)) nextHighlights[idx] = v;
              else nextHighlights[idx] = [v];
            });
          }
        } catch {
          // ignore
        }
      }
    }

    if (Object.keys(nextHighlights).length > 0) {
      sessionHadQuestionTextBackendRef.current = true;
    }
    highlightsRef.current = nextHighlights;
    setHighlights(nextHighlights);
    requestAnimationFrame(() => {
      highlightParentSyncReadyRef.current = true;
    });
  }, [storageKey, question.id, attemptId]);

  // Save highlights and notify parent when highlights change
  useEffect(() => {
    if (attemptId && onHighlightsChange) {
      // Convert to backend format and notify parent
      const backendFormat = convertHighlightsToBackendFormat(highlights);
      if (
        backendFormat.length === 0 &&
        !highlightParentSyncReadyRef.current
      ) {
        return;
      }
      if (backendFormat.length > 0) {
        sessionHadQuestionTextBackendRef.current = true;
        onHighlightsChange(backendFormat);
      } else if (sessionHadQuestionTextBackendRef.current) {
        sessionHadQuestionTextBackendRef.current = false;
        onHighlightsChange(backendFormat);
      }
    } else {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(highlights));
      } catch {
        // ignore
      }
    }
  }, [
    highlights,
    storageKey,
    attemptId,
    onHighlightsChange,
    convertHighlightsToBackendFormat,
  ]);

  // Navigatsiya: keyingi paintdan oldin ref yangilanmagan bo‘lsa ham oxirgi highlight saqlansin
  useEffect(() => {
    const qid = String(question.id);
    const aid = attemptId;
    const lsKey = aid ? `test_highlights_${aid}` : null;
    return () => {
      if (!aid) return;
      const backendFormat = convertHighlightsToBackendFormat(
        highlightsRef.current,
      );
      if (backendFormat.length === 0) return;
      if (onHighlightsChangeRef.current) {
        onHighlightsChangeRef.current(backendFormat);
      }
      if (lsKey && typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(lsKey);
          const all = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          all[qid] = backendFormat;
          window.localStorage.setItem(lsKey, JSON.stringify(all));
        } catch {
          // ignore
        }
      }
    };
  }, [question.id, attemptId, convertHighlightsToBackendFormat]);

  const handleCharClick = (
    index: number,
    isMarkupEnabled: boolean | undefined,
  ) => {
    if (!isMarkupEnabled) return;

    setHighlights((prev) => {
      const arr = prev[index] || [];
      if (arr.includes(selectedStyle)) return prev;
      const next = { ...prev, [index]: [...arr, selectedStyle] };
      highlightsRef.current = next;
      return next;
    });
  };

  const clearHighlights = () => {
    highlightsRef.current = {};
    setHighlights({});
  };

  const styleClasses: Record<HighlightStyle, string> = {
    yellow: "bg-yellow-200",
    green: "bg-green-200",
    blue: "bg-blue-200",
    pink: "bg-pink-200",
    underline: "underline",
    dotted: "underline decoration-dotted",
    bold: "font-semibold",
    italic: "italic",
  };

  // Support both legacy passage field and new sharedPassage; MD: question image imageUrl / image_url
  const passageText = question.sharedPassage?.content || question.passage;
  const questionImageUrl = getQuestionImageUrl(question);
  const hasPassage = !!passageText || !!questionImageUrl;
  const showPassage = hasPassage && !hidePassage;

  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });

  // Close toolbar when clicking outside
  useEffect(() => {
    if (!showFloatingToolbar) return;

    const handleClickOutside = () => {
      setShowFloatingToolbar(false);
    };

    // Small delay to allow toolbar button clicks
    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, { once: true });
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showFloatingToolbar]);

  // Selection-based markup: select text with mouse, then show floating toolbar
  const handleMouseUp = () => {
    if (!isMarkupEnabled) {
      setShowFloatingToolbar(false);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setShowFloatingToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position toolbar above selection
    setToolbarPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowFloatingToolbar(true);
  };

  const resolveSelectionCharRange = useCallback((): {
    from: number;
    to: number;
  } | null => {
    if (!isMarkupEnabled || !textRef.current) return null;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0)
      return null;
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    if (!selectedText) return null;

    const fullText = question.questionText || "";

    const getCharIndex = (node: Node, offset: number): number => {
      let current: Node | null = node;
      while (current && current !== textRef.current) {
        if (
          current instanceof HTMLElement &&
          current.dataset.charIndex !== undefined
        ) {
          const baseIndex = Number(current.dataset.charIndex);
          if (current === node || current.contains(node)) {
            return baseIndex + offset;
          }
        }
        current = current.parentNode;
      }

      let charIndex = 0;
      const walker = document.createTreeWalker(
        textRef.current!,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        null,
      );

      let currentNode: Node | null;
      while ((currentNode = walker.nextNode())) {
        if (currentNode === node) {
          return charIndex + offset;
        }
        if (
          currentNode instanceof HTMLElement &&
          currentNode.dataset.charIndex !== undefined
        ) {
          charIndex = Number(currentNode.dataset.charIndex) + 1;
        } else if (currentNode.nodeType === Node.TEXT_NODE) {
          charIndex += currentNode.textContent?.length || 0;
        }
      }

      const startPos = fullText.indexOf(selectedText);
      return startPos !== -1 ? startPos : 0;
    };

    const getCharSpan = (node: Node | null): HTMLSpanElement | null => {
      let current: Node | null = node;
      while (current && current !== textRef.current) {
        if (
          current instanceof HTMLElement &&
          current.dataset &&
          current.dataset.charIndex !== undefined
        ) {
          return current as HTMLSpanElement;
        }
        current = current.parentNode;
      }
      return null;
    };

    const startSpan = getCharSpan(range.startContainer);
    const endSpan = getCharSpan(range.endContainer);

    let startIndex: number;
    let endIndex: number;

    if (startSpan && endSpan) {
      startIndex = Number(startSpan.dataset.charIndex);
      endIndex = Number(endSpan.dataset.charIndex);
    } else {
      startIndex = getCharIndex(range.startContainer, range.startOffset);
      endIndex = getCharIndex(range.endContainer, range.endOffset);

      if (Number.isNaN(startIndex) || Number.isNaN(endIndex)) {
        const startPos = fullText.indexOf(selectedText);
        if (startPos === -1) return null;
        startIndex = startPos;
        endIndex = startPos + selectedText.length - 1;
      }
    }

    if (Number.isNaN(startIndex) || Number.isNaN(endIndex)) return null;
    const from = Math.min(startIndex, endIndex);
    const to = Math.max(startIndex, endIndex);
    return { from, to };
  }, [isMarkupEnabled, question.questionText]);

  const dismissSelectionToolbar = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setShowFloatingToolbar(false);
  }, []);

  const applyStyleToSelection = (style: HighlightStyle) => {
    const bounds = resolveSelectionCharRange();
    if (!bounds) {
      dismissSelectionToolbar();
      return;
    }
    const { from, to } = bounds;
    setHighlights((prev) => {
      const next = { ...prev };
      for (let i = from; i <= to; i++) {
        const arr = next[i] || [];
        if (arr.includes(style)) continue;
        next[i] = [...arr, style];
      }
      highlightsRef.current = next;
      return next;
    });
    dismissSelectionToolbar();
  };

  const clearFormattingFromSelection = () => {
    const bounds = resolveSelectionCharRange();
    if (!bounds) {
      dismissSelectionToolbar();
      return;
    }
    const { from, to } = bounds;
    setHighlights((prev) => {
      const next = { ...prev };
      for (let i = from; i <= to; i++) delete next[i];
      highlightsRef.current = next;
      return next;
    });
    dismissSelectionToolbar();
  };

  // Test (`attemptId`) da har doim bir xil pipeline — markup yoqilganda MarkdownRenderer ↔ mdast o‘tishi UI ni "sakratmasin"
  const showCharHighlightView =
    Boolean(attemptId) ||
    isMarkupEnabled ||
    Object.keys(highlights).length > 0;

  return (
    <div className="relative">
      {/* Floating Markup Toolbar (appears on text selection) */}
      {showFloatingToolbar && isMarkupEnabled && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex items-center gap-1"
          style={{
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Color buttons */}
          <button
            type="button"
            onClick={() => applyStyleToSelection("yellow")}
            className="w-6 h-6 rounded-full bg-yellow-300 border border-gray-300 hover:ring-2 hover:ring-gray-400"
            title="Yellow highlight"
          />
          <button
            type="button"
            onClick={() => applyStyleToSelection("green")}
            className="w-6 h-6 rounded-full bg-green-300 border border-gray-300 hover:ring-2 hover:ring-gray-400"
            title="Green highlight"
          />
          <button
            type="button"
            onClick={() => applyStyleToSelection("blue")}
            className="w-6 h-6 rounded-full bg-blue-300 border border-gray-300 hover:ring-2 hover:ring-gray-400"
            title="Blue highlight"
          />
          <button
            type="button"
            onClick={() => applyStyleToSelection("pink")}
            className="w-6 h-6 rounded-full bg-pink-300 border border-gray-300 hover:ring-2 hover:ring-gray-400"
            title="Pink highlight"
          />
          <div className="w-px h-6 bg-gray-300 mx-1" />
          {/* Bold, Italic, Underline – bir xil matnda birga qo‘llash mumkin */}
          <span className="text-[10px] text-gray-500 mr-0.5">Style</span>
          <button
            type="button"
            onClick={() => applyStyleToSelection("bold")}
            className="px-2 py-1 border rounded text-[10px] font-semibold hover:bg-gray-100"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => applyStyleToSelection("italic")}
            className="px-2 py-1 border rounded text-[10px] italic hover:bg-gray-100"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => applyStyleToSelection("underline")}
            className="px-2 py-1 border rounded text-[10px] underline hover:bg-gray-100"
            title="Underline"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => applyStyleToSelection("dotted")}
            className="px-2 py-1 border rounded text-[10px] underline decoration-dotted hover:bg-gray-100"
            title="Dotted underline"
          >
            U.
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => clearFormattingFromSelection()}
            className="px-2 py-1 border rounded text-[10px] text-gray-700 hover:bg-red-50 hover:border-red-200"
            title="Clear highlights from selection"
          >
            Clear
          </button>
        </div>
      )}

      {/* Savol matni: remark + mdast — admin bold/italic/list jadval/math; highlight indekslari manba matn bilan mos */}
      <div className="space-y-2">
        {showCharHighlightView ? (
          question.questionText ? (
            <MarkdownWithCharHighlights
              markdown={question.questionText}
              highlights={highlights}
              isMarkupEnabled={isMarkupEnabled}
              onCharClick={(index) => handleCharClick(index, isMarkupEnabled)}
              containerRef={textRef}
              onMouseUp={isMarkupEnabled ? handleMouseUp : undefined}
              className={isMarkupEnabled ? "select-text" : "select-none"}
              styleClasses={styleClasses}
            />
          ) : (
            <span className="text-gray-500 italic">
              No question text available
            </span>
          )
        ) : (
          <div className="text-sm sm:text-base text-gray-900 leading-relaxed">
            {question.questionText ? (
              <MarkdownRenderer content={question.questionText} />
            ) : (
              <span className="text-gray-500 italic">
                No question text available
              </span>
            )}
          </div>
        )}
      </div>

      {/* Only show choices if not showOnlyQuestionText */}
      {!showOnlyQuestionText && (
        <>
          {/* Multiple Choice */}
          {hasChoiceOptions(question) ? (
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
              {(question.choices ?? []).map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id;
                const letter = String.fromCharCode(65 + index); // A, B, C, D

                return (
                  <button
                    key={choice.id || index}
                    onClick={() => onSelectChoice(choice.id)}
                    className={`w-full text-left p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span
                        className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {letter}
                      </span>
                      <div className="flex-1 min-w-0">
                        {getChoiceText(choice) ? (
                          <div className="block text-gray-900">
                            <MarkdownRenderer content={getChoiceText(choice)} className="text-inherit" />
                          </div>
                        ) : (
                          <span className="block text-gray-500 italic">
                            Choice {letter}
                          </span>
                        )}
                        {getChoiceImageUrl(choice) && (
                          <span className="block mt-3 p-1 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                            <img
                              src={getChoiceImageUrl(choice)!}
                              alt={`Choice ${letter}`}
                              className="rounded object-contain max-h-12 w-full bg-gray-100 min-h-[24px]"
                              loading="lazy"
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Student-Produced Response (Grid-in) – ochiq javob */}
          {isOpenAnswerQuestion(question) && (
            <div className="space-y-2 mt-4 pt-2">
              <div>
                <input
                  type="text"
                  value={textAnswer || ""}
                  onChange={(e) => onTextAnswerChange(e.target.value)}
                  placeholder="Enter your answer (e.g. 5.566, -5.566, 2/3, -2/3)"
                  pattern="[0-9.\\-/]+"
                  className="max-w-[240px] w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  💡 Tips:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Enter only the numerical answer</li>
                  <li>Use &quot;/&quot; for fractions (e.g., 3/4)</li>
                  <li>Use &quot;.&quot; for decimals (e.g., 0.75)</li>
                  <li>Use &quot;-&quot; for negative numbers (e.g., -5)</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
