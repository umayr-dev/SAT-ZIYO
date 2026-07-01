"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";

const REF_MIN_W = 320;
const REF_MIN_H = 400;
const REF_MAX_W = 700;
const REF_MAX_H = 900;

export interface ReferenceSheetPanelProps {
  width: number;
  height: number;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
  embedded?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export function ReferenceSheetPanel({
  width,
  height,
  onSizeChange,
  onClose,
  embedded = false,
  position,
  onPositionChange,
}: ReferenceSheetPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, y: e.clientY, w: width, h: height };
      const handleMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startRef.current.x;
        const dy = moveEvent.clientY - startRef.current.y;
        const newW = Math.max(
          REF_MIN_W,
          Math.min(REF_MAX_W, startRef.current.w + dx),
        );
        const newH = Math.max(
          REF_MIN_H,
          Math.min(REF_MAX_H, startRef.current.h + dy),
        );
        onSizeChange({ width: newW, height: newH });
      };
      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [width, height, onSizeChange],
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-ref-resize]")) return;
      if (embedded && onPositionChange && position) {
        const startX = e.clientX - position.x;
        const startY = e.clientY - position.y;
        const handleMove = (moveEvent: MouseEvent) => {
          onPositionChange({
            x: Math.max(0, moveEvent.clientX - startX),
            y: Math.max(0, moveEvent.clientY - startY),
          });
        };
        const handleUp = () => {
          window.removeEventListener("mousemove", handleMove);
          window.removeEventListener("mouseup", handleUp);
        };
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return;
      }
      const target = panelRef.current;
      if (!target) return;
      const startX = e.clientX - target.offsetLeft;
      const startY = e.clientY - target.offsetTop;
      const handleMove = (moveEvent: MouseEvent) => {
        target.style.left = `${Math.max(0, moveEvent.clientX - startX)}px`;
        target.style.top = `${Math.max(0, moveEvent.clientY - startY)}px`;
        target.style.bottom = "auto";
        target.style.right = "auto";
      };
      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [embedded, onPositionChange, position],
  );

  const panel = (
    <div
      ref={panelRef}
      className={
        embedded
          ? "bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200 cursor-move"
          : "pointer-events-auto absolute bottom-20 right-4 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
      }
      style={{ width: `${width}px`, height: `${height}px` }}
      onMouseDown={handleDragStart}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 cursor-move select-none">
        <h2 className="text-xs font-semibold text-gray-800">Reference Sheet</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] text-gray-500 hover:text-gray-800"
        >
          Close
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto relative bg-gray-100">
        <Image
          src="/reference-sheet.png"
          alt="Math Reference Sheet - formulas and facts"
          className="w-full h-auto object-contain block"
          width={1200}
          height={800}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling;
            if (fallback instanceof HTMLElement) fallback.hidden = false;
          }}
        />
        <div
          hidden
          className="p-4 text-sm text-gray-600 text-center"
          aria-hidden="true"
        >
          Add{" "}
          <span className="bg-gray-200 px-1 font-mono">reference-sheet.png</span>{" "}
          to the <span className="bg-gray-200 px-1 font-mono">public</span> folder
          for the formula reference image.
        </div>
        <div
          data-ref-resize
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize bg-gray-300 hover:bg-gray-400 rounded-tl border-t border-l border-gray-400"
          aria-label="Resize"
        />
      </div>
    </div>
  );

  if (embedded) return panel;
  return <div className="pointer-events-none fixed inset-0 z-40">{panel}</div>;
}
