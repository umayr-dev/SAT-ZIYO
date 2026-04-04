"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { MarkdownRenderer } from "@/src/components/markdown/MarkdownRenderer";

type HighlightStyle =
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "underline"
  | "dotted"
  | "bold"
  | "italic";

interface HighlightablePassageProps {
  passageText: string;
  isMarkupEnabled?: boolean;
  attemptId?: string;
  questionId: string;
  className?: string;
  onHighlightsChange?: (
    highlights: Array<{
      startOffset: number;
      endOffset: number;
      color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
      note?: string | null;
    }>,
  ) => void;
}

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

export function HighlightablePassage({
  passageText,
  isMarkupEnabled = false,
  attemptId,
  questionId,
  className = "",
  onHighlightsChange,
}: HighlightablePassageProps) {
  const [highlights, setHighlights] = useState<Record<number, HighlightStyle[]>>({});
  const passageRef = useRef<HTMLParagraphElement | null>(null);
  /** Birinchi bo‘sh tickda LS dan passage highlight o‘chib ketmasin */
  const passageLsSyncReadyRef = useRef(false);
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;
  const isMarkupEnabledRef = useRef(isMarkupEnabled);
  isMarkupEnabledRef.current = isMarkupEnabled;
  const onHighlightsChangeRef = useRef(onHighlightsChange);
  onHighlightsChangeRef.current = onHighlightsChange;
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });

  const storageKey = attemptId ? `test_highlights_${attemptId}` : null;
  const passageStorageKey = `${questionId}_passage`;

  const convertToBackendFormat = useCallback(
    (h: Record<number, HighlightStyle[]>) => {
      if (Object.keys(h).length === 0) return [];
      const colorStyles: HighlightStyle[] = ["yellow", "green", "blue", "pink"];
      const getPrimaryColor = (styles: HighlightStyle[]) => {
        const c = styles.find((s) => colorStyles.includes(s));
        return c || "yellow";
      };
      const sortedIndices = Object.keys(h)
        .map(Number)
        .sort((a, b) => a - b);
      const ranges: Array<{ start: number; end: number; styles: HighlightStyle[] }> = [];
      let currentStart = sortedIndices[0];
      let currentEnd = sortedIndices[0];
      let currentStyles = h[sortedIndices[0]] || [];
      for (let i = 1; i < sortedIndices.length; i++) {
        const idx = sortedIndices[i];
        const styles = h[idx] || [];
        const sameStyles =
          currentStyles.length === styles.length &&
          currentStyles.every((s, j) => styles[j] === s);
        if (idx === currentEnd + 1 && sameStyles) {
          currentEnd = idx;
        } else {
          ranges.push({ start: currentStart, end: currentEnd, styles: currentStyles });
          currentStart = idx;
          currentEnd = idx;
          currentStyles = styles;
        }
      }
      ranges.push({ start: currentStart, end: currentEnd, styles: currentStyles });
      const colorMap: Record<HighlightStyle, "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE"> = {
        yellow: "YELLOW",
        green: "GREEN",
        blue: "BLUE",
        pink: "PINK",
        underline: "YELLOW",
        dotted: "YELLOW",
        bold: "YELLOW",
        italic: "YELLOW",
      };
      return ranges.map((range) => ({
        startOffset: range.start,
        endOffset: range.end + 1,
        color: colorMap[getPrimaryColor(range.styles)] || "YELLOW",
        note: null as string | null,
      }));
    },
    [],
  );

  useEffect(() => {
    passageLsSyncReadyRef.current = false;
    if (!isMarkupEnabled) {
      highlightsRef.current = {};
      setHighlights({});
      requestAnimationFrame(() => {
        passageLsSyncReadyRef.current = true;
      });
      return;
    }

    let next: Record<number, HighlightStyle[]> = {};
    if (storageKey && typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const all = JSON.parse(raw) as Record<
            string,
            Array<{ startOffset: number; endOffset: number; color: string }>
          >;
          const list = all[passageStorageKey] || [];
          const colorMap: Record<string, HighlightStyle> = {
            YELLOW: "yellow",
            GREEN: "green",
            BLUE: "blue",
            PINK: "pink",
            ORANGE: "yellow",
          };
          list.forEach((h) => {
            const style = colorMap[h.color] || "yellow";
            for (let i = h.startOffset; i < h.endOffset; i++) next[i] = [style];
          });
        }
      } catch {
        // ignore
      }
    }
    highlightsRef.current = next;
    setHighlights(next);
    requestAnimationFrame(() => {
      passageLsSyncReadyRef.current = true;
    });
  }, [storageKey, passageStorageKey, questionId, isMarkupEnabled]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (!isMarkupEnabled) return;
    const backend = convertToBackendFormat(highlights);
    if (backend.length === 0 && !passageLsSyncReadyRef.current) return;
    if (attemptId && onHighlightsChange) onHighlightsChange(backend);
    try {
      const raw = window.localStorage.getItem(storageKey);
      const all = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      if (backend.length > 0) all[passageStorageKey] = backend;
      else delete all[passageStorageKey];
      window.localStorage.setItem(storageKey, JSON.stringify(all));
    } catch {
      // ignore
    }
  }, [
    highlights,
    storageKey,
    passageStorageKey,
    attemptId,
    onHighlightsChange,
    convertToBackendFormat,
    isMarkupEnabled,
  ]);

  useEffect(() => {
    const key = storageKey;
    const pKey = passageStorageKey;
    return () => {
      if (!key || typeof window === "undefined" || !attemptId) return;
      if (!isMarkupEnabledRef.current) return;
      const backend = convertToBackendFormat(highlightsRef.current);
      if (backend.length === 0) return;
      try {
        const raw = window.localStorage.getItem(key);
        const all = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        all[pKey] = backend;
        window.localStorage.setItem(key, JSON.stringify(all));
      } catch {
        // ignore
      }
      if (onHighlightsChangeRef.current) {
        onHighlightsChangeRef.current(backend);
      }
    };
  }, [questionId, storageKey, passageStorageKey, attemptId, convertToBackendFormat]);

  useEffect(() => {
    if (!showFloatingToolbar) return;
    const handleClickOutside = () => setShowFloatingToolbar(false);
    const t = setTimeout(() => document.addEventListener("click", handleClickOutside, { once: true }), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showFloatingToolbar]);

  const handleMouseUp = useCallback(() => {
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
    setToolbarPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setShowFloatingToolbar(true);
  }, [isMarkupEnabled]);

  const applyStyleToSelection = useCallback(
    (style: HighlightStyle) => {
      if (!isMarkupEnabled || !passageRef.current) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      if (!selectedText) {
        setShowFloatingToolbar(false);
        return;
      }
      const fullText = passageText || "";
      const getCharSpan = (node: Node | null): HTMLSpanElement | null => {
        let current: Node | null = node;
        while (current && current !== passageRef.current) {
          if (
            current instanceof HTMLElement &&
            current.dataset?.charIndex !== undefined
          )
            return current as HTMLSpanElement;
          current = current.parentNode;
        }
        return null;
      };
      const startSpan = getCharSpan(range.startContainer);
      const endSpan = getCharSpan(range.endContainer);
      let startIndex: number;
      let endIndex: number;
      if (startSpan && endSpan) {
        startIndex = Number(startSpan.dataset.charIndex);
        endIndex = Number(endSpan.dataset.charIndex);
      } else {
        const startPos = fullText.indexOf(selectedText);
        if (startPos === -1) {
          setShowFloatingToolbar(false);
          return;
        }
        startIndex = startPos;
        endIndex = startPos + selectedText.length - 1;
      }
      const from = Math.min(startIndex, endIndex);
      const to = Math.max(startIndex, endIndex);
      setHighlights((prev) => {
        const next = { ...prev };
        for (let i = from; i <= to; i++) {
          const arr = next[i] || [];
          const idx = arr.indexOf(style);
          if (idx >= 0) {
            const newArr = arr.filter((_, j) => j !== idx);
            if (newArr.length === 0) delete next[i];
            else next[i] = newArr;
          } else next[i] = [...arr, style];
        }
        highlightsRef.current = next;
        return next;
      });
      selection.removeAllRanges();
      setShowFloatingToolbar(false);
    },
    [isMarkupEnabled, passageText],
  );

  const characters = useMemo(
    () => (passageText || "").split("").map((char, i) => ({ char, index: i })),
    [passageText],
  );

  if (!passageText) return null;

  return (
    <div className={`relative ${className}`}>
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
          <button type="button" onClick={() => applyStyleToSelection("yellow")} className="w-6 h-6 rounded-full bg-yellow-300 border border-gray-300 hover:ring-2 hover:ring-gray-400" title="Yellow highlight" />
          <button type="button" onClick={() => applyStyleToSelection("green")} className="w-6 h-6 rounded-full bg-green-300 border border-gray-300 hover:ring-2 hover:ring-gray-400" title="Green highlight" />
          <button type="button" onClick={() => applyStyleToSelection("blue")} className="w-6 h-6 rounded-full bg-blue-300 border border-gray-300 hover:ring-2 hover:ring-gray-400" title="Blue highlight" />
          <button type="button" onClick={() => applyStyleToSelection("pink")} className="w-6 h-6 rounded-full bg-pink-300 border border-gray-300 hover:ring-2 hover:ring-gray-400" title="Pink highlight" />
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button type="button" onClick={() => applyStyleToSelection("bold")} className="px-2 py-1 border rounded text-[10px] font-semibold hover:bg-gray-100" title="Bold">B</button>
          <button type="button" onClick={() => applyStyleToSelection("italic")} className="px-2 py-1 border rounded text-[10px] italic hover:bg-gray-100" title="Italic">I</button>
          <button type="button" onClick={() => applyStyleToSelection("underline")} className="px-2 py-1 border rounded text-[10px] underline hover:bg-gray-100" title="Underline">U</button>
          <button type="button" onClick={() => applyStyleToSelection("dotted")} className="px-2 py-1 border rounded text-[10px] underline decoration-dotted hover:bg-gray-100" title="Dotted">U.</button>
        </div>
      )}
      {isMarkupEnabled ? (
        <p
          ref={passageRef}
          onMouseUp={handleMouseUp}
          className="text-xs sm:text-sm md:text-base leading-relaxed select-text whitespace-pre-wrap"
        >
          {characters.map(({ char, index }) => {
            const styles = highlights[index] || [];
            const combinedClass = styles.map((s) => styleClasses[s]).filter(Boolean).join(" ");
            return (
              <span
                key={index}
                data-char-index={index}
                className={isMarkupEnabled ? `cursor-pointer ${combinedClass}` : combinedClass}
              >
                {char}
              </span>
            );
          })}
        </p>
      ) : (
        <div className="text-xs sm:text-sm md:text-base leading-relaxed">
          <MarkdownRenderer content={passageText} />
        </div>
      )}
    </div>
  );
}
