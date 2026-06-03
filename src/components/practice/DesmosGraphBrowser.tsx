"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  LineChart,
  Upload,
  X,
} from "lucide-react";
import {
  DESMOS_EXAMPLE_GRAPHS,
  type DesmosGraphState,
} from "@/src/data/desmos-example-graphs";
import {
  listSavedGraphs,
  removeSavedGraph,
  type StoredDesmosGraph,
} from "@/src/lib/desmos-graph-storage";

type Tab = "saved" | "examples";

export interface DesmosGraphBrowserProps {
  open: boolean;
  onClose: () => void;
  attemptId: string;
  onSelectGraph: (state: DesmosGraphState, title: string) => void;
  onNewGraph: () => void;
  onImportFile: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function GraphCard({
  title,
  subtitle,
  date,
  previewClass,
  onClick,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  date?: string;
  previewClass: string;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-blue-400 hover:shadow-md transition-all w-full"
    >
      <div
        className={`h-24 w-full bg-gradient-to-br ${previewClass} relative flex items-center justify-center`}
      >
        <svg
          viewBox="-5 -5 10 10"
          className="w-full h-full p-3 opacity-70"
          aria-hidden
        >
          <line
            x1="-5"
            y1="0"
            x2="5"
            y2="0"
            stroke="#94a3b8"
            strokeWidth="0.15"
          />
          <line
            x1="0"
            y1="-5"
            x2="0"
            y2="5"
            stroke="#94a3b8"
            strokeWidth="0.15"
          />
          <path
            d="M -4 3 Q 0 -4 4 2"
            fill="none"
            stroke="#2563eb"
            strokeWidth="0.25"
          />
        </svg>
        {onDelete && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onDelete();
              }
            }}
            className="absolute top-1 right-1 p-0.5 rounded bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-600"
            aria-label="Delete saved graph"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-gray-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>
        )}
        {date && <p className="text-[10px] text-gray-400 mt-0.5">{date}</p>}
      </div>
    </button>
  );
}

export function DesmosGraphBrowser({
  open,
  onClose,
  attemptId,
  onSelectGraph,
  onNewGraph,
  onImportFile,
}: DesmosGraphBrowserProps) {
  const [tab, setTab] = useState<Tab>("saved");
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(true);
  const [savedList, setSavedList] = useState<StoredDesmosGraph[]>([]);

  const refreshSaved = useCallback(() => {
    setSavedList(listSavedGraphs());
  }, []);

  useEffect(() => {
    if (open) refreshSaved();
  }, [open, refreshSaved]);

  if (!open) return null;

  const handleSelectSaved = (g: StoredDesmosGraph) => {
    onSelectGraph(g.state, g.title);
    onClose();
  };

  const handleSelectExample = (id: string) => {
    const ex = DESMOS_EXAMPLE_GRAPHS.find((e) => e.id === id);
    if (!ex) return;
    onSelectGraph(ex.state, ex.title);
    onClose();
  };

  const handleDelete = (id: string) => {
    removeSavedGraph(id);
    refreshSaved();
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-white"
      role="dialog"
      aria-label="Open graph"
    >
      <div className="flex items-center justify-end px-2 py-1 bg-[#2a2a2a] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-white/80 hover:text-white rounded"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 shrink-0 bg-gray-50">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNewMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <LineChart className="w-4 h-4 text-green-600" />
            New Graph
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {newMenuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Close menu"
                onClick={() => setNewMenuOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 min-w-[200px] rounded-md border border-gray-200 bg-white py-1 shadow-lg text-sm">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left"
                  onClick={() => {
                    onNewGraph();
                    setNewMenuOpen(false);
                    onClose();
                  }}
                >
                  <FilePlus className="w-4 h-4 text-green-600" />
                  New Graph
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left"
                  onClick={() => {
                    onImportFile();
                    setNewMenuOpen(false);
                  }}
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  Import from file…
                </button>
                <p className="px-3 py-2 text-[10px] text-gray-500 border-t border-gray-100 mt-1">
                  Notebook, Geometry, and 3D require desmos.com — not available
                  in practice embed.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 shrink-0">
        <button
          type="button"
          onClick={() => setTab("saved")}
          className={`flex-1 py-2.5 text-sm font-medium ${
            tab === "saved"
              ? "text-gray-900 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Saved Work
        </button>
        <button
          type="button"
          onClick={() => setTab("examples")}
          className={`flex-1 py-2.5 text-sm font-medium ${
            tab === "examples"
              ? "text-gray-900 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Examples
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-gray-50/80">
        {tab === "saved" ? (
          savedList.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-gray-600">No saved graphs yet.</p>
              <p className="text-xs text-gray-500 mt-2">
                Use <strong>Save</strong> in the toolbar, or start from an
                example.
              </p>
              <button
                type="button"
                onClick={() => setTab("examples")}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Browse examples
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {savedList.map((g) => (
                <GraphCard
                  key={g.id}
                  title={g.title}
                  subtitle={
                    g.attemptId === attemptId ? "This session" : undefined
                  }
                  date={formatDate(g.savedAt)}
                  previewClass="from-slate-100 to-slate-200"
                  onClick={() => handleSelectSaved(g)}
                  onDelete={
                    g.id.startsWith("attempt-") ? undefined : () => handleDelete(g.id)
                  }
                />
              ))}
            </div>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={() => setGalleryOpen((o) => !o)}
              className="flex items-center gap-1 w-full text-left text-sm font-semibold text-gray-800 mb-3"
            >
              {galleryOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Graphing Example Gallery
            </button>
            {galleryOpen && (
              <div className="grid grid-cols-2 gap-3">
                {DESMOS_EXAMPLE_GRAPHS.map((ex) => (
                  <GraphCard
                    key={ex.id}
                    title={ex.title}
                    subtitle={ex.subtitle}
                    date="Example"
                    previewClass={ex.previewClass}
                    onClick={() => handleSelectExample(ex.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 px-3 py-2 border-t border-gray-200 bg-white text-center">
        <p className="text-[10px] text-gray-500">
          Graphs save on this device for practice — not to a Desmos.com account.
        </p>
      </div>
    </div>
  );
}
