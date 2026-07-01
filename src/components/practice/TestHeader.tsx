"use client";

import { memo } from "react";
import {
  Calculator,
  StickyNote,
  Edit,
  BookOpen,
  MoreVertical,
} from "lucide-react";
import { ModuleWallClockTimer } from "@/src/components/practice/ModuleWallClockTimer";

const HEADER_BORDER_STYLE = {
  minHeight: "52px",
  maxHeight: 56,
  borderBottom: "2px dashed",
  borderImage:
    "repeating-linear-gradient(to right, rgb(167, 56, 87) 0%, rgb(167, 56, 87) 3.5%, transparent 3.5%, transparent 4%, rgb(249, 223, 205) 4%, rgb(249, 223, 205) 7.5%, transparent 7.5%, transparent 8%, rgb(28, 17, 103) 8%, rgb(28, 17, 103) 11.5%, transparent 11.5%, transparent 12%, rgb(94, 147, 101) 12%, rgb(94, 147, 101) 15.5%, transparent 15.5%, transparent 16%) 1 / 1 / 0 stretch",
} as const;

export interface TestHeaderProps {
  sectionOrderIndex: number;
  moduleNumber: number;
  sectionType: "ENGLISH" | "MATH";
  moduleDeadline: number | null;
  onTimeUp: () => void;
  onRemainingSecondsChange: (remaining: number) => void;
  isTimerHidden: boolean;
  onHideTimer: () => void;
  onShowTimer: () => void;
  isMarkupEnabled: boolean;
  onToggleMarkup: () => void;
  onOpenNotes: () => void;
  showReferenceSheet: boolean;
  onToggleReferenceSheet: () => void;
  showCalculator: boolean;
  onToggleCalculator: () => void;
  showMoreMenu: boolean;
  onToggleMoreMenu: () => void;
  onSaveAndExitFromMenu: () => void;
}

export const TestHeader = memo(function TestHeader({
  sectionOrderIndex,
  moduleNumber,
  sectionType,
  moduleDeadline,
  onTimeUp,
  onRemainingSecondsChange,
  isTimerHidden,
  onHideTimer,
  onShowTimer,
  isMarkupEnabled,
  onToggleMarkup,
  onOpenNotes,
  showReferenceSheet,
  onToggleReferenceSheet,
  showCalculator,
  onToggleCalculator,
  showMoreMenu,
  onToggleMoreMenu,
  onSaveAndExitFromMenu,
}: TestHeaderProps) {
  const isMath = sectionType === "MATH";

  return (
    <div
      className="flex-shrink-0 flex-none min-h-[52px] h-12 sm:h-14 bg-white text-gray-800 flex items-center justify-between border-b border-gray-300 relative mb-2 sm:mb-[15px] pl-2 pr-2 sm:pl-3 sm:pr-3"
      style={HEADER_BORDER_STYLE}
    >
      <div className="flex items-center min-w-0 flex-1 overflow-hidden">
        <p className="font-semibold text-[11px] min-[380px]:text-xs min-[480px]:text-sm truncate">
          Section {sectionOrderIndex + 1}, Module {moduleNumber}:{" "}
          {isMath ? "Math" : "Reading and Writing"}{" "}
          <button
            type="button"
            className="text-[11px] min-[380px]:text-xs min-[480px]:text-sm text-blue-600 hover:underline font-normal inline p-0 align-baseline"
          >
            Directions
          </button>
        </p>
      </div>

      <ModuleWallClockTimer
        moduleDeadline={moduleDeadline}
        onTimeUp={onTimeUp}
        onRemainingSecondsChange={onRemainingSecondsChange}
        isHidden={isTimerHidden}
        onHide={onHideTimer}
        onShow={onShowTimer}
      />

      <div className="flex items-center gap-1 sm:gap-2 flex-nowrap shrink-0">
        {!isMath && (
          <>
            <button
              type="button"
              onClick={onOpenNotes}
              className="flex items-center gap-1.5 p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs whitespace-nowrap"
              title="Open Notes"
            >
              <StickyNote className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">Notes</span>
            </button>
            <button
              type="button"
              onClick={onToggleMarkup}
              className={`flex items-center gap-1.5 p-2 rounded-lg text-xs whitespace-nowrap ${
                isMarkupEnabled
                  ? "text-blue-600 bg-gray-100"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-100 bg-gray-100 hover:bg-gray-200"
              }`}
              aria-label="Highlights and Notes"
            >
              <Edit className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">Highlights</span>
            </button>
          </>
        )}
        {isMath && (
          <>
            <button
              type="button"
              onClick={onToggleReferenceSheet}
              className={`flex items-center gap-1 min-[480px]:gap-1.5 p-1.5 min-[420px]:p-2 rounded-lg text-xs whitespace-nowrap ${
                showReferenceSheet
                  ? "text-blue-600 bg-gray-100"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-100 bg-gray-100 hover:bg-gray-200"
              }`}
              aria-label="Reference Sheet"
              title="Reference Sheet"
            >
              <BookOpen className="w-4 h-4 min-[420px]:w-5 min-[420px]:h-5 shrink-0" />
              <span className="hidden sm:inline">Reference</span>
            </button>
            <button
              type="button"
              onClick={onToggleCalculator}
              className={`flex items-center gap-1 min-[480px]:gap-1.5 p-1.5 min-[420px]:p-2 rounded-lg text-xs whitespace-nowrap ${
                showCalculator
                  ? "text-blue-600 bg-gray-100"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-100 bg-gray-100 hover:bg-gray-200"
              }`}
              aria-label="Calculator"
              title="Calculator"
            >
              <Calculator className="w-4 h-4 min-[420px]:w-5 min-[420px]:h-5 shrink-0" />
              <span className="hidden sm:inline">Calculator</span>
            </button>
          </>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleMoreMenu}
            className="flex items-center gap-1 min-[480px]:gap-1.5 p-1.5 min-[420px]:p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 text-xs whitespace-nowrap bg-gray-100"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 min-[420px]:w-5 min-[420px]:h-5 shrink-0" />
            <span className="hidden sm:inline">More</span>
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px] max-w-[90vw]">
              <button
                type="button"
                onClick={onSaveAndExitFromMenu}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Save and Exit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
