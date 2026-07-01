"use client";

import { memo } from "react";
import Image from "next/image";
import {
  getChoiceText,
  getChoiceImageUrl,
} from "@/src/services/practice.service";
import { MarkdownRenderer } from "@/src/components/markdown/MarkdownRenderer";

export type QuestionChoicesLayout = "default" | "desktop" | "mobile";

export interface QuestionChoiceItem {
  id?: string;
  [key: string]: unknown;
}

export interface QuestionChoicesPanelProps {
  choices: QuestionChoiceItem[];
  selectedChoiceId?: string;
  isEliminationMode: boolean;
  eliminatedChoiceIds: Set<string>;
  layout?: QuestionChoicesLayout;
  onChoiceClick: (choiceId: string) => void;
  onEliminationToggle: (choiceId: string) => void;
  onEliminationUndo: (choiceId: string) => void;
  className?: string;
}

export const QuestionChoicesPanel = memo(function QuestionChoicesPanel({
  choices,
  selectedChoiceId,
  isEliminationMode,
  eliminatedChoiceIds,
  layout = "default",
  onChoiceClick,
  onEliminationToggle,
  onEliminationUndo,
  className = "space-y-2 sm:space-y-3 md:space-y-4",
}: QuestionChoicesPanelProps) {
  const isDesktop = layout === "desktop";
  const isMobile = layout === "mobile";

  return (
    <div className={className}>
      {choices.map((choice, index) => {
        const isSelected =
          String(selectedChoiceId ?? "") === String(choice.id ?? "");
        const letter = String.fromCharCode(65 + index);
        const isEliminated = eliminatedChoiceIds.has(String(choice.id ?? ""));
        const choiceImageUrl = getChoiceImageUrl(
          choice as Record<string, unknown>,
        );

        const letterCircleClass = isDesktop
          ? isEliminationMode
            ? "border-gray-400 bg-white text-gray-700"
            : isSelected
              ? "border-black bg-black text-white"
              : isEliminated
                ? "border-gray-400 bg-gray-200 text-gray-400"
                : "border-black text-black"
          : isSelected
            ? "border-black bg-black text-white"
            : isEliminated
              ? "border-gray-400 bg-gray-200 text-gray-400"
              : "border-black text-black";

        const choiceImageBg = isDesktop ? "bg-gray-100" : "bg-white";

        return (
          <div
            key={choice.id || index}
            className={`relative w-full flex items-stretch rounded-lg border-2 overflow-hidden ${isSelected ? "border-black" : isEliminated ? "border-gray-300 bg-gray-100/70" : "border-gray-200"}`}
          >
            <button
              type="button"
              onClick={() => onChoiceClick(String(choice.id ?? ""))}
              className={`flex-1 min-w-0 ${isMobile ? "p-2 sm:p-3" : "p-2 sm:p-3 md:p-4"} text-left text-xs sm:text-sm ${isMobile ? "" : "md:text-base"} flex items-center gap-2 ${isMobile ? "sm:gap-3" : "md:gap-3"} cursor-pointer rounded-l-md ${isEliminated ? "bg-gray-200/90 text-gray-500 saturate-50" : "hover:bg-gray-200"}`}
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full font-bold border text-[10px] sm:text-xs ${letterCircleClass}`}
              >
                <span className="text-xs">{letter}</span>
              </div>
              <div
                className={`flex-1 min-w-0 ${isEliminated ? "line-through decoration-gray-400 text-gray-400 [&_.markdown-content]:opacity-55" : ""}`}
              >
                {getChoiceText(
                  choice as {
                    choiceText?: string | null;
                    choice_text?: string | null;
                  },
                ) ? (
                  <div className="block text-gray-900 pointer-events-none select-none">
                    <MarkdownRenderer
                      content={getChoiceText(
                        choice as {
                          choiceText?: string | null;
                          choice_text?: string | null;
                        },
                      )}
                      className="text-inherit"
                    />
                  </div>
                ) : (
                  <span className="block">Choice {letter}</span>
                )}
                {choiceImageUrl && (
                  <span
                    className={`block ${isMobile ? "mt-2" : "mt-3"} ${choiceImageBg} rounded border border-gray-200 overflow-hidden p-1`}
                  >
                    <Image
                      src={choiceImageUrl}
                      alt={`Variant ${letter}`}
                      width={160}
                      height={48}
                      className={`rounded object-contain max-h-12 w-full ${choiceImageBg} min-h-[24px]`}
                      loading="lazy"
                    />
                  </span>
                )}
              </div>
            </button>
            {isEliminationMode && (
              <div
                className={`flex-shrink-0 flex items-center ${isMobile ? "gap-1" : "gap-1.5"} pl-1 pr-2 py-2 border-l border-gray-200 bg-gray-50/50 rounded-r-md`}
              >
                {isEliminated && (
                  <button
                    type="button"
                    className={`${isMobile ? "text-[11px]" : "text-[11px] sm:text-xs"} font-medium text-gray-600 hover:underline whitespace-nowrap`}
                    onClick={(e) => {
                      if (isMobile) e.stopPropagation();
                      onEliminationUndo(String(choice.id ?? ""));
                    }}
                  >
                    Undo
                  </button>
                )}
                <button
                  type="button"
                  className={`flex items-center justify-center w-6 h-6 ${isMobile ? "" : "sm:w-7 sm:h-7"} rounded-full border font-bold text-[10px] ${isMobile ? "" : "sm:text-xs"} cursor-pointer shrink-0 ${isEliminated ? "border-gray-400 bg-gray-200 text-gray-500" : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  onClick={(e) => {
                    if (isMobile) e.stopPropagation();
                    onEliminationToggle(String(choice.id ?? ""));
                  }}
                  aria-label={
                    isEliminated
                      ? isMobile
                        ? `Undo ${letter}`
                        : `Undo strike-through ${letter}`
                      : isMobile
                        ? `Strike ${letter}`
                        : `Strike through ${letter}`
                  }
                >
                  {letter}
                </button>
              </div>
            )}
            {isEliminated && (
              <div
                className={`pointer-events-none absolute left-10 ${isMobile ? "right-14" : "right-14 sm:right-16"} top-1/2 h-[1.5px] bg-gray-400/80 rounded-full -translate-y-1/2`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
