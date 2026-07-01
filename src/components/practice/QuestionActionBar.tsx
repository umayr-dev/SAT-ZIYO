"use client";

import { memo } from "react";
import { Flag } from "lucide-react";

export type QuestionActionBarVariant = "default" | "desktopSplit" | "mobile";

export interface QuestionActionBarProps {
  questionIndex: number;
  isFlagged: boolean;
  showEliminationToggle: boolean;
  isEliminationMode: boolean;
  onToggleFlag: () => void;
  onToggleEliminationMode: () => void;
  variant?: QuestionActionBarVariant;
}

function AbcToggleButton({
  isEliminationMode,
  onToggle,
  variant,
}: {
  isEliminationMode: boolean;
  onToggle: () => void;
  variant: QuestionActionBarVariant;
}) {
  if (variant === "desktopSplit") {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center text-xs sm:text-sm text-gray-600 hover:text-black ml-2 sm:ml-3 h-7 sm:h-8 px-2 rounded-md sm:rounded-lg border ${
          isEliminationMode
            ? "border-blue-500 bg-blue-500"
            : "border-gray-300 bg-white"
        }`}
      >
        <span
          className={`relative inline-flex items-center justify-center px-0.5 text-[12px] font-medium ${isEliminationMode ? "text-white" : "text-black"}`}
        >
          ABC
          <span
            className={`pointer-events-none absolute left-[1px] right-[1px] top-[56%] -translate-y-1/2 -rotate-20 border-t ${isEliminationMode ? "border-white" : "border-gray-600"}`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        variant === "mobile"
          ? "flex-shrink-0 flex items-center text-[11px] sm:text-xs text-gray-700 hover:text-black h-7 sm:h-8"
          : "flex items-center text-xs sm:text-sm text-gray-600 hover:text-black ml-2 sm:ml-3 h-7 sm:h-8"
      }
    >
      <div
        className={`relative border rounded-sm w-9 h-9 px-1 flex items-center justify-center ${isEliminationMode ? "bg-blue-500 border-blue-500" : "bg-transparent border-gray-300"}`}
      >
        <span
          className={`relative inline-flex items-center justify-center px-0.5 font-medium ${variant === "mobile" ? "text-[12px]" : "text-[13px]"} ${isEliminationMode ? "text-white" : "text-black"}`}
        >
          ABC
          <span
            className={`pointer-events-none absolute left-[1px] right-[1px] top-[56%] -translate-y-1/2 -rotate-20 border-t ${isEliminationMode ? "border-white" : "border-gray-600"}`}
          />
        </span>
      </div>
    </button>
  );
}

export const QuestionActionBar = memo(function QuestionActionBar({
  questionIndex,
  isFlagged,
  showEliminationToggle,
  isEliminationMode,
  onToggleFlag,
  onToggleEliminationMode,
  variant = "default",
}: QuestionActionBarProps) {
  const isMobile = variant === "mobile";
  const isDesktopSplit = variant === "desktopSplit";

  return (
    <div
      className={
        isMobile
          ? "question-index-container flex items-center justify-between bg-gray-200 rounded-lg mb-4 sm:mb-6 py-1 px-2 sm:px-3"
          : "flex items-center justify-between bg-gray-200 rounded-lg mb-4 sm:mb-5 md:mb-6 py-0.5 sm:py-1 pt-5"
      }
    >
      <div
        className={
          isMobile
            ? "flex items-center gap-2 sm:gap-3 min-w-0"
            : "flex items-center h-full"
        }
      >
        <p
          className={
            isMobile
              ? "question-index font-semibold bg-black text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-l rounded-r-none"
              : "question-index font-semibold bg-black text-white text-xs sm:text-sm h-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-l rounded-r-none"
          }
        >
          {questionIndex}
        </p>
        <button
          type="button"
          onClick={onToggleFlag}
          className={
            isMobile
              ? "flex items-center text-xs sm:text-sm text-gray-600 hover:text-black"
              : "flex items-center text-xs sm:text-sm text-gray-600 hover:text-black mr-1 sm:mr-2 h-full px-1 sm:px-2"
          }
        >
          <Flag
            className={
              isDesktopSplit
                ? `w-5 h-5 sm:w-6 sm:h-6 ${
                    isFlagged
                      ? "fill-orange-500 text-orange-500 drop-shadow-sm"
                      : "text-gray-500"
                  }`
                : `w-4 h-4 sm:w-5 sm:h-5 text-gray-500 ${isFlagged ? "fill-orange-500 text-orange-500" : ""}`
            }
          />
          <span
            className={
              isMobile ? "ml-0.5 sm:ml-1" : "ml-0.5 sm:ml-1 text-xs sm:text-sm"
            }
          >
            Mark for Review
          </span>
        </button>
      </div>
      {showEliminationToggle && (
        <AbcToggleButton
          isEliminationMode={isEliminationMode}
          onToggle={onToggleEliminationMode}
          variant={variant}
        />
      )}
    </div>
  );
});
