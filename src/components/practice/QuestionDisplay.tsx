"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Question } from "@/src/services/practice.service";

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
}: QuestionDisplayProps) {
  // Text highlight state: map of character index -> color
  const [selectedStyle, setSelectedStyle] = useState<HighlightStyle>("yellow");
  const [highlights, setHighlights] = useState<Record<number, HighlightStyle>>({});
  const textRef = useRef<HTMLParagraphElement | null>(null);

  const storageKey = useMemo(
    () => `sat-question-highlights-${question.id}`,
    [question.id]
  );

  useEffect(() => {
    // Clear highlights when question changes (question.id changes)
    setHighlights({});
    
    // Load saved highlights for this specific question
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setHighlights(parsed || {});
      }
    } catch {
      // ignore
    }
  }, [storageKey, question.id]);

  // Clear highlights when markup is disabled
  useEffect(() => {
    if (!isMarkupEnabled) {
      setHighlights({});
    }
  }, [isMarkupEnabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(highlights));
    } catch {
      // ignore
    }
  }, [highlights, storageKey]);

  const handleCharClick = (index: number, isMarkupEnabled: boolean | undefined) => {
    if (!isMarkupEnabled) return;

    setHighlights((prev) => {
      const next = { ...prev };
      if (next[index] === selectedStyle) {
        // same style -> remove highlight
        delete next[index];
      } else {
        next[index] = selectedStyle;
      }
      return next;
    });
  };

  const clearHighlights = () => {
    setHighlights({});
  };

  // Convert question text to array of characters with their indices
  const characters = useMemo(() => {
    const text = question.questionText || "";
    return text.split("").map((char, index) => ({
      char,
      index,
    }));
  }, [question.questionText]);

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

  const hasPassage = !!question.passage || !!question.imageUrl;
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

  const applyStyleToSelection = (style: HighlightStyle) => {
    if (!isMarkupEnabled) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    if (!selectedText || !textRef.current) {
      setShowFloatingToolbar(false);
      return;
    }

    // Get the full text content
    const fullText = question.questionText || "";
    
    // Find character index by traversing DOM
    const getCharIndex = (node: Node, offset: number): number => {
      // First try to find parent span with charIndex
      let current: Node | null = node;
      while (current && current !== textRef.current) {
        if (current instanceof HTMLElement && current.dataset.charIndex !== undefined) {
          const baseIndex = Number(current.dataset.charIndex);
          // If node is the span itself, return baseIndex + offset
          if (current === node || current.contains(node)) {
            return baseIndex + offset;
          }
        }
        current = current.parentNode;
      }
      
      // Fallback: count all characters before this node
      let charIndex = 0;
      let walker = document.createTreeWalker(
        textRef.current!,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        null
      );
      
      let currentNode: Node | null;
      while ((currentNode = walker.nextNode())) {
        if (currentNode === node) {
          return charIndex + offset;
        }
        if (currentNode instanceof HTMLElement && currentNode.dataset.charIndex !== undefined) {
          charIndex = Number(currentNode.dataset.charIndex) + 1;
        } else if (currentNode.nodeType === Node.TEXT_NODE) {
          charIndex += currentNode.textContent?.length || 0;
        }
      }
      
      // Final fallback: use text matching
      const startPos = fullText.indexOf(selectedText);
      return startPos !== -1 ? startPos : 0;
    };

    // Try to get character indices from data attributes first
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
      // Both are in character spans
      startIndex = Number(startSpan.dataset.charIndex);
      endIndex = Number(endSpan.dataset.charIndex);
    } else {
      // Calculate from range offsets
      startIndex = getCharIndex(range.startContainer, range.startOffset);
      endIndex = getCharIndex(range.endContainer, range.endOffset);
      
      // If calculation failed, use text matching as fallback
      if (Number.isNaN(startIndex) || Number.isNaN(endIndex)) {
        const startPos = fullText.indexOf(selectedText);
        if (startPos !== -1) {
          startIndex = startPos;
          endIndex = startPos + selectedText.length - 1;
        } else {
          setShowFloatingToolbar(false);
          return;
        }
      }
    }

    if (Number.isNaN(startIndex) || Number.isNaN(endIndex)) {
      setShowFloatingToolbar(false);
      return;
    }

    const from = Math.min(startIndex, endIndex);
    const to = Math.max(startIndex, endIndex);

    setHighlights((prev) => {
      const next = { ...prev };
      for (let i = from; i <= to; i++) {
        if (next[i] === style) {
          delete next[i];
        } else {
          next[i] = style;
        }
      }
      return next;
    });

    // Clear selection and hide toolbar
    selection.removeAllRanges();
    setShowFloatingToolbar(false);
  };

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
          {/* Text style buttons */}
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
        </div>
      )}

      {/* Question Text */}
      <div className="space-y-2">
        <p
          ref={textRef}
          onMouseUp={handleMouseUp}
          className="text-base text-gray-900 leading-relaxed select-text"
        >
          {question.questionText ? (
            characters.map(({ char, index }) => {
              const style = highlights[index];
              return (
                <span
                  key={index}
                  data-char-index={index}
                  onClick={() => handleCharClick(index, isMarkupEnabled)}
                  className={`${isMarkupEnabled ? "cursor-pointer" : ""} ${
                    style ? styleClasses[style] : ""
                  }`}
                >
                  {char}
                </span>
              );
            })
          ) : (
            <span className="text-gray-500 italic">No question text available</span>
          )}
        </p>
      </div>

      {/* Only show choices if not showOnlyQuestionText */}
      {!showOnlyQuestionText && (
        <>
          {/* Multiple Choice */}
          {question.questionType === "MULTIPLE_CHOICE" && question.choices && question.choices.length > 0 ? (
            <div className="space-y-3 mt-4">
              {question.choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id;
                const letter = String.fromCharCode(65 + index); // A, B, C, D

                return (
                  <button
                    key={choice.id || index}
                    onClick={() => onSelectChoice(choice.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 text-gray-900">
                        {choice.choiceText || `Choice ${letter}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : question.questionType === "MULTIPLE_CHOICE" ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
              <p className="text-sm text-yellow-800">
                ⚠ No choices available for this question
              </p>
            </div>
          ) : null}

          {/* Student-Produced Response (Grid-in) */}
          {question.questionType === "STUDENT_PRODUCED" && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your answer:
                </label>
                <input
                  type="text"
                  value={textAnswer || ""}
                  onChange={(e) => onTextAnswerChange(e.target.value)}
                  placeholder="Type your answer"
                  pattern="[0-9.\\-/]+"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
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

