"use client";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredSet: Set<number>;
  flaggedSet?: Set<number>;
  onJump: (index: number) => void;
}

/**
 * Question Navigator Component
 * Shows all questions with their status
 */
export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answeredSet,
  flaggedSet = new Set(),
  onJump,
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

  return (
    <div>
      <div className="mb-1">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = answeredSet.has(i);
            const isFlagged = flaggedSet.has(i);

            let buttonClass =
              "w-8 h-8 rounded-md border text-[11px] font-medium flex items-center justify-center transition-colors shadow-sm";

            if (isCurrent) {
              buttonClass += " bg-orange-500 text-white border-orange-500";
            } else if (isFlagged) {
              // Mark flagged questions in darker orange
              buttonClass += " bg-orange-100 text-orange-800 border-orange-500";
            } else if (isAnswered) {
              buttonClass += " bg-orange-50 text-orange-700 border-orange-300";
            } else {
              buttonClass += " bg-white text-gray-700 border-gray-300 hover:border-orange-300";
            }

            return (
              <button
                key={i}
                onClick={() => onJump(i)}
                className={buttonClass}
                title={`Question ${i + 1}${isAnswered ? " (answered)" : ""}${isFlagged ? " (flagged)" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-50 border border-orange-300"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-white border border-gray-300"></div>
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-100 border border-orange-400"></div>
          <span>Flagged</span>
        </div>
      </div>
    </div>
  );
}

