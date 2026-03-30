"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Table2,
  Sigma,
  ChevronDown,
  Underline,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  rows?: number;
  className?: string;
  /** Show math (LaTeX) insert button — e.g. only for Math module */
  showMathTools?: boolean;
  /** Show table insert button — e.g. false for variant (choice) input */
  showTable?: boolean;
  "data-testid"?: string;
}

/** Insert math at cursor. Use $...$ for inline (KaTeX in remarkMath). */
function insertMathAtCursor(
  textarea: HTMLTextAreaElement,
  insert: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const newText = text.substring(0, start) + insert + text.substring(end);
  onChange(newText);
  const cursorAfter = start + insert.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursorAfter, cursorAfter);
  });
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string = "",
  wrapSelection: boolean = true,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);

  let newText: string;
  let newCursor: number;

  if (wrapSelection && selected) {
    newText =
      text.substring(0, start) +
      before +
      selected +
      after +
      text.substring(end);
    newCursor = start + before.length + selected.length + after.length;
  } else {
    newText = text.substring(0, start) + before + after + text.substring(end);
    newCursor = start + before.length + after.length;
  }

  return { newText, newCursor };
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "",
  minHeight = "80px",
  rows = 4,
  className = "",
  showMathTools = false,
  showTable = true,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = useCallback(
    (before: string, after: string = "", wrapSelection = true) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const { newText, newCursor } = insertAtCursor(
        ta,
        before,
        after,
        wrapSelection,
      );
      onChange(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(newCursor, newCursor);
      });
    },
    [onChange],
  );

  const handleBold = () => applyFormat("**", "**");
  const handleItalic = () => applyFormat("*", "*");
  const handleUnderline = () => applyFormat("<u>", "</u>");
  const handleBulletList = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const text = ta.value;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const insert = "- ";
    const newText =
      text.substring(0, lineStart) + insert + text.substring(lineStart);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(
        lineStart + insert.length,
        lineStart + insert.length,
      );
    });
  };
  const handleNumberedList = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const text = ta.value;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const insert = "1. ";
    const newText =
      text.substring(0, lineStart) + insert + text.substring(lineStart);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(
        lineStart + insert.length,
        lineStart + insert.length,
      );
    });
  };

  const handleInsertTable = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const text = ta.value;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const prefix = text.substring(0, lineStart);
    const suffix = text.substring(lineStart);
    const table =
      "\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n|  |  |  |\n|  |  |  |\n";
    const newText = prefix + table + suffix;
    onChange(newText);
    const cursorAfter = lineStart + table.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorAfter, cursorAfter);
    });
  };

  const [mathOpen, setMathOpen] = useState(false);
  const mathMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mathOpen) return;
    const close = (e: MouseEvent) => {
      if (
        mathMenuRef.current &&
        !mathMenuRef.current.contains(e.target as Node)
      ) {
        setMathOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [mathOpen]);

  const insertMath = useCallback(
    (s: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      insertMathAtCursor(ta, s, onChange);
      setMathOpen(false);
    },
    [onChange],
  );

  const mathItems: { label: string; insert: string }[] = [
    // Fractions & roots
    { label: "Fraction ½", insert: "$\\frac{1}{2}$" },
    { label: "Fraction a/b", insert: "$\\frac{a}{b}$" },
    { label: "√x", insert: "$\\sqrt{x}$" },
    { label: "∛x", insert: "$\\sqrt[3]{x}$" },
    { label: "ⁿ√x", insert: "$\\sqrt[n]{x}$" },
    // Powers & indices
    { label: "x²", insert: "$x^2$" },
    { label: "xⁿ", insert: "$x^n$" },
    { label: "x₁", insert: "$x_1$" },
    { label: "xₙ", insert: "$x_n$" },
    // Greek & common
    { label: "π", insert: "$\\pi$" },
    { label: "∞", insert: "$\\infty$" },
    { label: "θ", insert: "$\\theta$" },
    { label: "Δ", insert: "$\\Delta$" },
    { label: "°", insert: "$^\\circ$" },
    { label: "α β γ", insert: "$\\alpha$ $\\beta$ $\\gamma$" },
    // Inequalities
    { label: "≤ ≥", insert: "$\\leq$ $\\geq$" },
    { label: "< >", insert: "$<$ $>$" },
    { label: "≠ ≈", insert: "$\\neq$ $\\approx$" },
    // Operations
    { label: "× ÷", insert: "$\\times$ $\\div$" },
    { label: "· (dot)", insert: "$\\cdot$" },
    { label: "± ∓", insert: "$\\pm$ $\\mp$" },
    { label: "%", insert: "$\\%$" },
    // Geometry
    { label: "∠", insert: "$\\angle$" },
    { label: "△", insert: "$\\triangle$" },
    { label: "∥ ⊥", insert: "$\\parallel$ $\\perp$" },
    { label: "≅ ∼", insert: "$\\cong$ $\\sim$" },
    { label: "AB̄", insert: "$\\overline{AB}$" },
    { label: "∴", insert: "$\\therefore$" },
    // Algebra & functions
    { label: "|x|", insert: "$\\lvert x \\rvert$" },
    { label: "x̄", insert: "$\\bar{x}$" },
    { label: "∑", insert: "$\\sum_{i=1}^{n}$" },
    { label: "∏", insert: "$\\prod_{i=1}^{n}$" },
    { label: "…", insert: "$\\ldots$" },
    { label: "⋯", insert: "$\\cdots$" },
    // Sets & logic
    { label: "∈ ∉", insert: "$\\in$ $\\notin$" },
    { label: "∅", insert: "$\\emptyset$" },
    { label: "⊂ ⊃", insert: "$\\subset$ $\\supset$" },
    { label: "∪ ∩", insert: "$\\cup$ $\\cap$" },
    // Combinatorics
    { label: "C(n,k)", insert: "$\\binom{n}{k}$" },
  ];

  // Murakkab misollar: \dfrac = uzun kasr chizig'i (display-style fraction)
  const mathCompound: { label: string; insert: string }[] = [
    { label: "Uzun kasr (blok)", insert: "$$\\dfrac{a+b+c}{x+y+z}$$" },
    { label: "√a/b (ildiz suratda)", insert: "$\\dfrac{\\sqrt{a}}{b}$" },
    { label: "a/√b (ildiz maxrajda)", insert: "$\\dfrac{a}{\\sqrt{b}}$" },
    { label: "√a/√b", insert: "$\\dfrac{\\sqrt{a}}{\\sqrt{b}}$" },
    { label: "(√x+1)/2", insert: "$\\dfrac{\\sqrt{x}+1}{2}$" },
    { label: "1/√x", insert: "$\\dfrac{1}{\\sqrt{x}}$" },
    { label: "a²/b (daraja suratda)", insert: "$\\dfrac{a^2}{b}$" },
    { label: "a/b² (daraja maxrajda)", insert: "$\\dfrac{a}{b^2}$" },
    { label: "√(a/b)", insert: "$\\sqrt{\\dfrac{a}{b}}$" },
    { label: "∛(a/b)", insert: "$\\sqrt[3]{\\dfrac{a}{b}}$" },
    { label: "(a+b)/c", insert: "$\\dfrac{a+b}{c}$" },
    { label: "a/(b+c)", insert: "$\\dfrac{a}{b+c}$" },
    { label: "(a+b)²", insert: "$(a+b)^2$" },
    { label: "(a−b)²", insert: "$(a-b)^2$" },
    { label: "(a+b)(a−b)", insert: "$(a+b)(a-b)$" },
    { label: "(a+b)³", insert: "$(a+b)^3$" },
    { label: "√(x²+y²)", insert: "$\\sqrt{x^2+y^2}$" },
    { label: "√(a²−b²)", insert: "$\\sqrt{a^2-b^2}$" },
    {
      label: "Kvadrat formulasi",
      insert: "$\\dfrac{-b \\pm \\sqrt{b^2-4ac}}{2a}$",
    },
    { label: "√a + √b", insert: "$\\sqrt{a}+\\sqrt{b}$" },
    { label: "x^(1/2)", insert: "$x^{1/2}$" },
    { label: "x^(2/3)", insert: "$x^{2/3}$" },
  ];

  return (
    <div
      className={`border border-gray-300 rounded-md overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-0.5 p-1 bg-gray-100 border-b border-gray-300">
        <button
          type="button"
          onClick={handleBold}
          className="p-1.5 rounded hover:bg-gray-200"
          title="Bold (**text**)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className="p-1.5 rounded hover:bg-gray-200"
          title="Italic (*text*)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleUnderline}
          className="p-1.5 rounded hover:bg-gray-200"
          title="Underline (&lt;u&gt;)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleBulletList}
          className="p-1.5 rounded hover:bg-gray-200"
          title="Bullet list (- item)"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleNumberedList}
          className="p-1.5 rounded hover:bg-gray-200"
          title="Numbered list (1. item)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        {showTable && (
          <button
            type="button"
            onClick={handleInsertTable}
            className="p-1.5 rounded hover:bg-gray-200"
            title="Insert table (Markdown)"
          >
            <Table2 className="w-4 h-4" />
          </button>
        )}
        {showMathTools && (
          <div className="relative flex items-center" ref={mathMenuRef}>
            <button
              type="button"
              onClick={() => setMathOpen((o) => !o)}
              className="p-1.5 rounded hover:bg-gray-200 flex items-center gap-0.5"
              title="Insert math (fraction, root, symbols)"
            >
              <Sigma className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {mathOpen && (
              <div className="absolute left-0 top-full mt-0.5 z-50 min-w-[280px] max-w-[380px] rounded-lg border border-gray-200 bg-white shadow-lg p-2 grid grid-cols-3 gap-1 text-left max-h-[70vh] overflow-y-auto">
                <p className="col-span-3 text-[10px] font-medium text-gray-500 uppercase tracking-wide px-1 py-0.5">
                  Math (LaTeX) — SAT
                </p>
                {mathItems.map(({ label, insert }) => (
                  <button
                    key={`s-${label}-${insert}`}
                    type="button"
                    onClick={() => insertMath(insert)}
                    className="text-xs px-2 py-1.5 rounded hover:bg-gray-100 text-gray-700 text-left truncate"
                    title={insert}
                  >
                    {label}
                  </button>
                ))}
                <p className="col-span-3 text-[10px] font-medium text-gray-600 mt-2 pt-1.5 border-t border-gray-100 px-1">
                  Murakkab (surat/maxrajda ildiz, qavs, daraja)
                </p>
                {mathCompound.map(({ label, insert }) => (
                  <button
                    key={`c-${label}-${insert}`}
                    type="button"
                    onClick={() => insertMath(insert)}
                    className="text-xs px-2 py-1.5 rounded hover:bg-gray-100 text-gray-700 text-left truncate"
                    title={insert}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-0 resize-y min-h-[80px]"
        style={{ minHeight }}
      />
    </div>
  );
}
