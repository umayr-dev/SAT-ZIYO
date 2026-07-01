"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { Button } from "@/src/ui/button";

export interface NotesPanelProps {
  questionIndex: number;
  noteText?: string;
  newNoteText: string;
  onNewNoteTextChange: (value: string) => void;
  onClose: () => void;
  onAddNote: () => void;
  onClearNotes: () => void;
}

export const NotesPanel = memo(function NotesPanel({
  questionIndex,
  noteText,
  newNoteText,
  onNewNoteTextChange,
  onClose,
  onAddNote,
  onClearNotes,
}: NotesPanelProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Notes for Question {questionIndex}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close notes"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {noteText ? (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Your Notes:
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {noteText}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onClearNotes}
              >
                Clear All Notes
              </Button>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              No notes yet. Add your first note below.
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Add Note:</h3>
          <textarea
            value={newNoteText}
            onChange={(e) => onNewNoteTextChange(e.target.value)}
            placeholder="Type your note here..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onAddNote();
              }
            }}
          />
          <Button
            onClick={onAddNote}
            disabled={!newNoteText.trim()}
            className="w-full mt-2 bg-gray-900 hover:bg-gray-800"
          >
            Add Note
          </Button>
        </div>
      </div>
    </>
  );
});
