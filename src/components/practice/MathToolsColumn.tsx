"use client";

import dynamic from "next/dynamic";
import { memo } from "react";

const DesmosCalculatorPanel = dynamic(
  () =>
    import("@/src/components/practice/DesmosCalculatorPanel").then(
      (m) => m.DesmosCalculatorPanel,
    ),
  { ssr: false, loading: () => null },
);

const ReferenceSheetPanel = dynamic(
  () =>
    import("@/src/components/practice/ReferenceSheetPanel").then(
      (m) => m.ReferenceSheetPanel,
    ),
  { ssr: false, loading: () => null },
);

export interface MathToolsColumnProps {
  isDesktopLayout: boolean;
  showCalculator: boolean;
  showReferenceSheet: boolean;
  attemptId: string;
  desmosSize: { width: number; height: number };
  desmosPosition: { x: number; y: number };
  referenceSheetSize: { width: number; height: number };
  referenceSheetPosition: { x: number; y: number };
  onDesmosSizeChange: (size: { width: number; height: number }) => void;
  onDesmosPositionChange: (pos: { x: number; y: number }) => void;
  onReferenceSheetSizeChange: (size: { width: number; height: number }) => void;
  onReferenceSheetPositionChange: (pos: { x: number; y: number }) => void;
  onCloseCalculator: () => void;
  onCloseReferenceSheet: () => void;
}

export const MathToolsColumn = memo(function MathToolsColumn({
  isDesktopLayout,
  showCalculator,
  showReferenceSheet,
  attemptId,
  desmosSize,
  desmosPosition,
  referenceSheetSize,
  referenceSheetPosition,
  onDesmosSizeChange,
  onDesmosPositionChange,
  onReferenceSheetSizeChange,
  onReferenceSheetPositionChange,
  onCloseCalculator,
  onCloseReferenceSheet,
}: MathToolsColumnProps) {
  const isOpen = showCalculator || showReferenceSheet;
  const isVisible = isDesktopLayout && isOpen;

  return (
    <div
      className={`flex-shrink-0 relative min-h-0 z-10 transition-[width,min-width] duration-300 ease-out ${isOpen ? "overflow-visible" : "overflow-hidden"}`}
      style={{
        width: isVisible ? "50%" : "0",
        minWidth: isVisible ? "50%" : "0",
      }}
    >
      <div
        className="h-full w-full overflow-visible transition-opacity duration-250 ease-out"
        style={{ opacity: isOpen ? 1 : 0 }}
      >
        {showCalculator ? (
          <div
            className="absolute min-w-0"
            style={{
              left: desmosPosition.x,
              top: desmosPosition.y,
              overflow: "visible",
            }}
          >
            <DesmosCalculatorPanel
              attemptId={attemptId}
              width={desmosSize.width}
              height={desmosSize.height}
              onSizeChange={onDesmosSizeChange}
              onClose={onCloseCalculator}
              embedded
              position={desmosPosition}
              onPositionChange={onDesmosPositionChange}
            />
          </div>
        ) : showReferenceSheet ? (
          <div
            className="absolute min-w-0"
            style={{
              left: referenceSheetPosition.x,
              top: referenceSheetPosition.y,
              overflow: "visible",
            }}
          >
            <ReferenceSheetPanel
              width={referenceSheetSize.width}
              height={referenceSheetSize.height}
              onSizeChange={onReferenceSheetSizeChange}
              onClose={onCloseReferenceSheet}
              embedded
              position={referenceSheetPosition}
              onPositionChange={onReferenceSheetPositionChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});
