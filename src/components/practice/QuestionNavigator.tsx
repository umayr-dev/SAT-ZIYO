"use client";

import { X, MapPin, Flag } from "lucide-react";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredSet: Set<number>;
  flaggedSet?: Set<number>;
  onJump: (index: number) => void;
  onClose: () => void;
  sectionTitle?: string;
  onGoToReview?: () => void;
}

/**
 * Question Navigator Component
 * Shows all questions with their status in a modal popup
 */
export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answeredSet,
  flaggedSet = new Set(),
  onJump,
  onClose,
  sectionTitle,
  onGoToReview,
}: QuestionNavigatorProps) {
  // Validate totalQuestions
  if (!totalQuestions || totalQuestions <= 0) {
    console.warn("[QuestionNavigator] Invalid totalQuestions:", totalQuestions);
    return (
      <div className="text-sm text-yellow-600 p-2">
        ⚠ Invalid question count: {totalQuestions}
      </div>
    );
  }

  // Calculate grid columns (approximately 9 columns like in the image)
  const gridCols = 9;
  const rows = Math.ceil(totalQuestions / gridCols);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-t-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {sectionTitle || "Questions"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-400 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-gray-600" />
              </div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-dashed border-gray-400 bg-white"></div>
              <span>Unanswered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-400 bg-white flex items-center justify-center">
                <Flag className="w-3 h-3 text-red-500" />
              </div>
              <span>For Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-500"></div>
              <span>Answered</span>
            </div>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: totalQuestions }, (_, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = answeredSet.has(i);
              const isFlagged = flaggedSet.has(i);

              let buttonClass =
                "w-10 h-10 rounded border-2 text-sm font-medium flex items-center justify-center transition-all relative";

              if (isCurrent) {
                buttonClass += " border-gray-400 bg-white text-gray-900";
              } else if (isFlagged && !isAnswered) {
                buttonClass += " border-gray-400 bg-white text-gray-900 border-dashed";
              } else if (isAnswered) {
                buttonClass += " border-blue-500 bg-blue-500 text-white";
              } else {
                buttonClass += " border-gray-400 bg-white text-gray-900 border-dashed";
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    onJump(i);
                    onClose();
                  }}
                  className={buttonClass}
                  title={`Question ${i + 1}${isAnswered ? " (answered)" : ""}${isFlagged ? " (flagged)" : ""}`}
                >
                  {isCurrent && (
                    <MapPin className="absolute -top-1 -right-1 w-3 h-3 text-gray-600" />
                  )}
                  {isFlagged && !isCurrent && (
                    <Flag className="absolute top-0.5 right-0.5 w-3 h-3 text-red-500" />
                  )}
                  <span className={isCurrent ? "mt-1" : ""}>{i + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {onGoToReview && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                onGoToReview();
                onClose();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Review Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

