"use client";

import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/src/ui/button";

const FOOTER_BORDER_STYLE = {
  minHeight: 44,
  maxHeight: 48,
  borderTop: "2px dashed",
  backgroundColor: "rgb(229, 235, 245)",
  borderImage:
    "repeating-linear-gradient(to right, rgb(167, 56, 87) 0%, rgb(167, 56, 87) 3.5%, transparent 3.5%, transparent 4%, rgb(249, 223, 205) 4%, rgb(249, 223, 205) 7.5%, transparent 7.5%, transparent 8%, rgb(28, 17, 103) 8%, rgb(28, 17, 103) 11.5%, transparent 11.5%, transparent 12%, rgb(94, 147, 101) 12%, rgb(94, 147, 101) 15.5%, transparent 15.5%, transparent 16%) 1 / 1 / 0 stretch",
} as const;

export interface TestFooterProps {
  userLabel: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  submitting: boolean;
  isQuestionLoading: boolean;
  onToggleNavigator: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onFinishSection: () => void;
}

export const TestFooter = memo(function TestFooter({
  userLabel,
  currentQuestionIndex,
  totalQuestions,
  isLastQuestion,
  submitting,
  isQuestionLoading,
  onToggleNavigator,
  onPrevious,
  onNext,
  onFinishSection,
}: TestFooterProps) {
  const navDisabled = submitting || isQuestionLoading;

  return (
    <div
      className="flex-shrink-0 flex-none min-h-[44px] h-11 sm:h-12 bg-white text-gray-800 flex items-center justify-between border-t border-gray-300 relative mt-2 sm:mt-[15px] px-2 sm:px-3"
      style={FOOTER_BORDER_STYLE}
    >
      <p className="text-xs sm:text-sm truncate max-w-[60px] min-[380px]:max-w-[90px] min-[420px]:max-w-[100px] sm:max-w-[120px] shrink-0">
        {userLabel}
      </p>
      <div
        className="bg-black text-white px-2 py-1 min-[420px]:px-3 min-[420px]:py-1.5 flex items-center gap-1 min-[420px]:gap-2 rounded-lg min-[420px]:rounded-xl cursor-pointer shrink-0 min-w-0 max-w-[50%]"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
        onClick={onToggleNavigator}
      >
        <p className="text-white text-xs min-[420px]:text-sm truncate">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </p>
        <button
          className="p-0.5 min-[420px]:p-1 rounded shrink-0"
          style={{ pointerEvents: "none" }}
        >
          <ChevronRight className="w-3 h-3 min-[420px]:w-4 min-[420px]:h-4" />
        </button>
      </div>
      <div className="flex gap-1 min-[420px]:gap-2 shrink-0">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0 || navDisabled}
          className="px-2 py-1.5 min-[420px]:px-4 min-[420px]:py-2 text-xs min-[420px]:text-sm text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "rgb(51, 76, 199)",
            opacity: currentQuestionIndex === 0 ? 0.5 : 1,
          }}
        >
          Back
        </Button>
        {!isLastQuestion ? (
          <Button
            onClick={onNext}
            disabled={navDisabled}
            className="px-2 py-1.5 min-[420px]:px-4 min-[420px]:py-2 text-xs min-[420px]:text-sm text-white rounded-full cursor-pointer"
            style={{ backgroundColor: "rgb(51, 76, 199)" }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={onFinishSection}
            disabled={navDisabled}
            className="px-2 py-1.5 min-[420px]:px-4 min-[420px]:py-2 text-xs min-[420px]:text-sm text-white rounded-full cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: "rgb(51, 76, 199)" }}
          >
            Finish
          </Button>
        )}
      </div>
    </div>
  );
});
