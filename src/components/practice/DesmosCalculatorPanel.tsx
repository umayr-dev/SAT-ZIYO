"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  FolderOpen,
  MoreHorizontal,
  FilePlus,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";
import {
  DESMOS_DEFAULT_H,
  DESMOS_DEFAULT_W,
  DESMOS_GRAPHING_OPTIONS,
  DESMOS_MAX_H,
  DESMOS_MAX_W,
  DESMOS_MIN_H,
  DESMOS_MIN_W,
  getDesmosScriptUrl,
} from "@/src/config/desmos";
import type { DesmosGraphState } from "@/src/data/desmos-example-graphs";
import {
  getAttemptGraphKey,
  loadAttemptGraph,
  saveAttemptGraph,
} from "@/src/lib/desmos-graph-storage";
import { DesmosGraphBrowser } from "@/src/components/practice/DesmosGraphBrowser";

type DesmosCalculatorInstance = {
  destroy: () => void;
  resize: () => void;
  getState: () => DesmosGraphState;
  setState: (state: DesmosGraphState, options?: { allowUndo?: boolean }) => void;
  setBlank: () => void;
};

type DesmosGlobal = {
  GraphingCalculator: (
    el: HTMLElement,
    opts?: Record<string, boolean | string>,
  ) => DesmosCalculatorInstance;
};

export interface DesmosCalculatorPanelProps {
  /** Practice attempt id — used to persist graph per test session */
  attemptId: string;
  width?: number;
  height?: number;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onClose: () => void;
  embedded?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export function DesmosCalculatorPanel({
  attemptId,
  width = DESMOS_DEFAULT_W,
  height = DESMOS_DEFAULT_H,
  onSizeChange,
  onClose,
  embedded = false,
  position,
  onPositionChange,
}: DesmosCalculatorPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculatorInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [scriptReady, setScriptReady] = useState(false);
  const [graphTitle, setGraphTitle] = useState("Untitled Graph");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);

  const keys = getAttemptGraphKey(attemptId);

  useEffect(() => {
    const loaded = loadAttemptGraph(attemptId);
    if (loaded?.title) setGraphTitle(loaded.title);
  }, [attemptId]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as { Desmos?: DesmosGlobal }).Desmos) {
      setScriptReady(true);
    }
  }, []);

  const applyGraph = useCallback((state: DesmosGraphState, title: string) => {
    const calc = calculatorRef.current;
    if (!calc) return;
    calc.setState(state, { allowUndo: true });
    setGraphTitle(title.trim() || "Untitled Graph");
  }, []);

  const loadSavedGraph = useCallback(() => {
    const loaded = loadAttemptGraph(attemptId);
    if (loaded) applyGraph(loaded.state, loaded.title);
  }, [attemptId, applyGraph]);

  useEffect(() => {
    if (!scriptReady || !containerRef.current) return;

    const Desmos = (window as { Desmos?: DesmosGlobal }).Desmos;
    if (!Desmos?.GraphingCalculator) return;

    const el = containerRef.current;
    calculatorRef.current = Desmos.GraphingCalculator(el, {
      ...DESMOS_GRAPHING_OPTIONS,
    });

    const t = window.setTimeout(loadSavedGraph, 100);

    return () => {
      window.clearTimeout(t);
      calculatorRef.current?.destroy();
      calculatorRef.current = null;
    };
  }, [scriptReady, loadSavedGraph]);

  useEffect(() => {
    if (!scriptReady || !calculatorRef.current) return;
    try {
      calculatorRef.current.resize();
    } catch {
      // ignore
    }
  }, [width, height, scriptReady]);

  const handleSave = useCallback(() => {
    const calc = calculatorRef.current;
    if (!calc || typeof window === "undefined") return;
    try {
      const title = graphTitle.trim() || "Untitled Graph";
      saveAttemptGraph(attemptId, title, calc.getState());
      setGraphTitle(title);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      window.setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, [graphTitle, attemptId]);

  const handleNewGraph = useCallback(() => {
    calculatorRef.current?.setBlank();
    setGraphTitle("Untitled Graph");
    try {
      localStorage.removeItem(keys.graph);
      localStorage.removeItem(keys.title);
    } catch {
      // ignore
    }
    setMenuOpen(false);
  }, [keys.graph, keys.title]);

  const handleExport = useCallback(() => {
    const calc = calculatorRef.current;
    if (!calc) return;
    try {
      const title = graphTitle.trim() || "Untitled Graph";
      const payload = {
        title,
        state: calc.getState(),
        savedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${payload.title.replace(/\s+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSaveStatus("error");
    }
    setMenuOpen(false);
  }, [graphTitle]);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !calculatorRef.current) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as {
            title?: string;
            state?: DesmosGraphState;
          };
          if (parsed.state) {
            applyGraph(
              parsed.state,
              parsed.title || "Imported Graph",
            );
            saveAttemptGraph(
              attemptId,
              parsed.title || "Imported Graph",
              parsed.state,
            );
          }
          setMenuOpen(false);
          setBrowserOpen(false);
        } catch {
          setSaveStatus("error");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [applyGraph, attemptId],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!onSizeChange) return;
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, y: e.clientY, w: width, h: height };
      const handleMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startRef.current.x;
        const dy = moveEvent.clientY - startRef.current.y;
        onSizeChange({
          width: Math.max(
            DESMOS_MIN_W,
            Math.min(DESMOS_MAX_W, startRef.current.w + dx),
          ),
          height: Math.max(
            DESMOS_MIN_H,
            Math.min(DESMOS_MAX_H, startRef.current.h + dy),
          ),
        });
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

  const handlePanelDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, input, [data-no-drag]")) {
        return;
      }

      if (embedded && onPositionChange && position) {
        e.preventDefault();
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
      if (!target || embedded) return;
      e.preventDefault();
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

  const saveLabel =
    saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
        ? "Error"
        : "Save";

  const panel = (
    <div
      ref={panelRef}
      className={
        embedded
          ? "bg-white rounded-xl shadow-xl flex flex-col border border-gray-200 overflow-hidden"
          : "pointer-events-auto absolute top-24 left-4 bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden"
      }
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 cursor-move select-none shrink-0"
        onMouseDown={handlePanelDragStart}
      >
        <h2 className="text-xs font-semibold text-gray-800">
          Graphing Calculator
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] text-gray-500 hover:text-gray-800 px-2 py-1"
        >
          Close
        </button>
      </div>

      {/* Desmos.com-style graph bar (API does not provide this — custom UI) */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 bg-[#1a1a1a] text-white shrink-0 border-b border-black/30"
        data-no-drag
      >
        <button
          type="button"
          title="Open graph — saved work and examples"
          onClick={() => setBrowserOpen(true)}
          className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white"
          aria-label="Open graph browser"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFile}
        />
        <div className="h-4 w-px bg-white/20 shrink-0" aria-hidden />
        <input
          type="text"
          value={graphTitle}
          onChange={(e) => setGraphTitle(e.target.value)}
          onBlur={() => {
            const t = graphTitle.trim() || "Untitled Graph";
            setGraphTitle(t);
            try {
              localStorage.setItem(keys.title, t);
            } catch {
              // ignore
            }
          }}
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none border-none focus:ring-0 truncate"
          aria-label="Graph title"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!scriptReady}
          className={`shrink-0 px-3 py-0.5 text-xs font-medium rounded border transition-colors ${
            saveStatus === "saved"
              ? "border-green-500 text-green-400"
              : "border-white/40 text-white hover:bg-white/10"
          }`}
        >
          {saveLabel}
        </button>
        <div className="relative shrink-0" data-no-drag>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
            aria-label="More options"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border border-gray-200 bg-white py-1 text-gray-800 shadow-lg text-xs">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100"
                  onClick={handleNewGraph}
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  New graph
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100"
                  onClick={() => {
                    loadSavedGraph();
                    setMenuOpen(false);
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reload saved
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100"
                  onClick={handleExport}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import JSON
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative bg-gray-50 overflow-hidden">
        <DesmosGraphBrowser
          open={browserOpen}
          onClose={() => {
            setBrowserOpen(false);
            window.requestAnimationFrame(() => {
              try {
                calculatorRef.current?.resize();
              } catch {
                // ignore
              }
            });
          }}
          attemptId={attemptId}
          onSelectGraph={applyGraph}
          onNewGraph={handleNewGraph}
          onImportFile={() => fileInputRef.current?.click()}
        />
        <div
          ref={containerRef}
          className={`absolute inset-0 w-full h-full ${browserOpen ? "invisible" : ""}`}
          style={{ minHeight: 200 }}
          aria-hidden={browserOpen}
        />
        {!scriptReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm z-10">
            Loading calculator…
          </div>
        )}
        {onSizeChange && (
          <div
            data-desmos-resize
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize bg-gray-300 hover:bg-gray-400 rounded-tl border-t border-l border-gray-400 z-20"
            aria-label="Resize calculator"
          />
        )}
      </div>
      <p className="sr-only">
        Graphs are saved on this device for this practice session, not to a
        Desmos account.
      </p>
    </div>
  );

  const script = (
    <Script
      src={getDesmosScriptUrl()}
      strategy="lazyOnload"
      onLoad={() => setScriptReady(true)}
    />
  );

  if (embedded) {
    return (
      <>
        {script}
        {panel}
      </>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {script}
      {panel}
    </div>
  );
}
