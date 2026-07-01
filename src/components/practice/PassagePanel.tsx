"use client";

import dynamic from "next/dynamic";
import { memo } from "react";

const HighlightablePassage = dynamic(
  () =>
    import("@/src/components/practice/HighlightablePassage").then(
      (m) => m.HighlightablePassage,
    ),
  { ssr: false, loading: () => null },
);

type PassageHighlight = {
  startOffset: number;
  endOffset: number;
  color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
  note?: string | null;
};

export interface PassagePanelProps {
  questionId: string;
  passageText: string;
  isMarkupEnabled: boolean;
  attemptId: string;
  onHighlightsChange: (highlights: PassageHighlight[]) => void;
  className?: string;
}

export const PassagePanel = memo(function PassagePanel({
  questionId,
  passageText,
  isMarkupEnabled,
  attemptId,
  onHighlightsChange,
  className = "p-3 sm:p-4 md:p-5 bg-white rounded-lg",
}: PassagePanelProps) {
  return (
    <div className={className}>
      <HighlightablePassage
        key={questionId}
        passageText={passageText}
        isMarkupEnabled={isMarkupEnabled}
        attemptId={attemptId}
        questionId={questionId}
        onHighlightsChange={onHighlightsChange}
      />
    </div>
  );
});
