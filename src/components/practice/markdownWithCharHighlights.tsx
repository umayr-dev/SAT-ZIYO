"use client";

import React, { Fragment, useMemo, type ReactNode } from "react";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { Literal, PhrasingContent, Root, RootContent } from "mdast";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export type CharHighlightStyle =
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "underline"
  | "dotted"
  | "bold"
  | "italic";

const defaultStyleClasses: Record<CharHighlightStyle, string> = {
  yellow: "bg-yellow-200",
  green: "bg-green-200",
  blue: "bg-blue-200",
  pink: "bg-pink-200",
  underline: "underline",
  dotted: "underline decoration-dotted",
  bold: "font-semibold",
  italic: "italic",
};

const BG_HIGHLIGHT_STYLES = new Set<CharHighlightStyle>([
  "yellow",
  "green",
  "blue",
  "pink",
]);

function parseMd(markdown: string): Root | null {
  if (!markdown || !markdown.trim()) return null;
  try {
    const tree = remark()
      .use(remarkGfm)
      .use(remarkMath)
      .parse(markdown) as Root;
    return tree;
  } catch {
    return null;
  }
}

function renderCharSpans(
  value: string,
  startOffset: number,
  keyBase: string,
  highlights: Record<number, CharHighlightStyle[]>,
  styleClasses: Record<CharHighlightStyle, string>,
  isMarkupEnabled: boolean,
  onCharClick?: (index: number) => void,
): ReactNode[] {
  const out: ReactNode[] = [];
  const spanBase =
    "inline align-baseline decoration-inherit [box-decoration-break:clone] [-webkit-box-decoration-break:clone]";
  for (let i = 0; i < value.length; i++) {
    const globalIndex = startOffset + i;
    const char = value[i];
    const styles = highlights[globalIndex] || [];
    const combinedClass = styles
      .map((s) => styleClasses[s])
      .filter(Boolean)
      .join(" ");
    const hasBgHighlight = styles.some((s) => BG_HIGHLIGHT_STYLES.has(s));
    const padForBg = hasBgHighlight ? "px-[1px] py-px" : "";
    out.push(
      <span
        key={`${keyBase}-${globalIndex}`}
        data-char-index={globalIndex}
        onClick={
          isMarkupEnabled && onCharClick
            ? () => onCharClick(globalIndex)
            : undefined
        }
        className={`${spanBase} ${padForBg} ${isMarkupEnabled ? "cursor-pointer" : ""} ${combinedClass}`.trim()}
      >
        {char === "\n" ? <br /> : char}
      </span>,
    );
  }
  return out;
}

function renderLiteralChars(
  node: Literal,
  keyBase: string,
  highlights: Record<number, CharHighlightStyle[]>,
  styleClasses: Record<CharHighlightStyle, string>,
  isMarkupEnabled: boolean,
  onCharClick?: (index: number) => void,
): ReactNode {
  const pos = node.position;
  const value = node.value;
  if (!value) return null;
  if (!pos) {
    return (
      <span key={keyBase} className="whitespace-pre-wrap">
        {value}
      </span>
    );
  }
  const start = pos.start.offset ?? 0;
  return (
    <Fragment key={keyBase}>
      {renderCharSpans(
        value,
        start,
        keyBase,
        highlights,
        styleClasses,
        isMarkupEnabled,
        onCharClick,
      )}
    </Fragment>
  );
}

function renderPhrasingList(
  nodes: PhrasingContent[],
  keyPrefix: string,
  highlights: Record<number, CharHighlightStyle[]>,
  styleClasses: Record<CharHighlightStyle, string>,
  isMarkupEnabled: boolean,
  onCharClick?: (index: number) => void,
): ReactNode[] {
  return nodes.map((n, i) =>
    renderPhrasing(n, `${keyPrefix}-p-${i}`, highlights, styleClasses, isMarkupEnabled, onCharClick),
  );
}

function renderPhrasing(
  node: PhrasingContent,
  keyPrefix: string,
  highlights: Record<number, CharHighlightStyle[]>,
  styleClasses: Record<CharHighlightStyle, string>,
  isMarkupEnabled: boolean,
  onCharClick?: (index: number) => void,
): ReactNode {
  switch (node.type) {
    case "text":
      return (
        <Fragment key={keyPrefix}>
          {renderCharSpans(
            node.value,
            node.position?.start.offset ?? 0,
            keyPrefix,
            highlights,
            styleClasses,
            isMarkupEnabled,
            onCharClick,
          )}
        </Fragment>
      );
    case "inlineCode":
      return (
        <code
          key={keyPrefix}
          className="px-1 py-0.5 rounded bg-gray-100 text-sm font-mono"
        >
          {renderLiteralChars(
            node,
            keyPrefix,
            highlights,
            styleClasses,
            isMarkupEnabled,
            onCharClick,
          )}
        </code>
      );
    case "strong":
      return (
        <strong key={keyPrefix} className="font-semibold">
          {renderPhrasingList(
            node.children,
            keyPrefix,
            highlights,
            styleClasses,
            isMarkupEnabled,
            onCharClick,
          )}
        </strong>
      );
    case "emphasis":
      return (
        <em key={keyPrefix} className="italic">
          {renderPhrasingList(
            node.children,
            keyPrefix,
            highlights,
            styleClasses,
            isMarkupEnabled,
            onCharClick,
          )}
        </em>
      );
    case "delete":
      return (
        <del key={keyPrefix} className="line-through">
          {renderPhrasingList(
            node.children,
            keyPrefix,
            highlights,
            styleClasses,
            isMarkupEnabled,
            onCharClick,
          )}
        </del>
      );
    case "link":
      return (
        <a
          key={keyPrefix}
          href={node.url}
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          {renderPhrasingList(
            node.children,
            keyPrefix,
            highlights,
            styleClasses,
            isMarkupEnabled,
            onCharClick,
          )}
        </a>
      );
    case "break":
      return <br key={keyPrefix} />;
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={keyPrefix}
          src={node.url}
          alt={node.alt || ""}
          title={node.title || undefined}
          className="inline-block max-h-24 max-w-full align-middle rounded my-1"
        />
      );
    case "inlineMath":
      return (
        <span key={keyPrefix} className="inline-block align-middle mx-0.5">
          <MathInline latex={node.value} />
        </span>
      );
    case "footnoteReference":
      return (
        <sup key={keyPrefix} className="text-blue-600">
          [{node.identifier}]
        </sup>
      );
    case "html":
      return (
        <span
          key={keyPrefix}
          dangerouslySetInnerHTML={{ __html: node.value }}
        />
      );
    default:
      return null;
  }
}

function MathInline({ latex }: { latex: string }) {
  return <InlineMath math={latex} />;
}

function MathBlock({ latex }: { latex: string }) {
  return (
    <div className="my-2 overflow-x-auto">
      <BlockMath math={latex} />
    </div>
  );
}

function renderBlock(
  node: RootContent,
  keyPrefix: string,
  highlights: Record<number, CharHighlightStyle[]>,
  styleClasses: Record<CharHighlightStyle, string>,
  isMarkupEnabled: boolean,
  onCharClick?: (index: number) => void,
): ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={keyPrefix} className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap">
          {renderPhrasingList(
            node.children,
            keyPrefix,
            highlights,
            styleClasses,
            isMarkupEnabled,
            onCharClick,
          )}
        </p>
      );
    case "heading": {
      const Tag = (`h${node.depth}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
      return (
        <Tag
          key={keyPrefix}
          className="font-bold mb-2 mt-3 first:mt-0 leading-snug whitespace-pre-wrap"
        >
          {renderPhrasingList(
            node.children,
            keyPrefix,
            highlights,
            styleClasses,
            isMarkupEnabled,
            onCharClick,
          )}
        </Tag>
      );
    }
    case "blockquote":
      return (
        <blockquote
          key={keyPrefix}
          className="border-l-4 border-gray-300 pl-3 my-2 text-gray-800"
        >
          {node.children.map((c, i) =>
            renderBlock(
              c as RootContent,
              `${keyPrefix}-bq-${i}`,
              highlights,
              styleClasses,
              isMarkupEnabled,
              onCharClick,
            ),
          )}
        </blockquote>
      );
    case "list": {
      const ListTag = node.ordered ? "ol" : "ul";
      return (
        <ListTag
          key={keyPrefix}
          className={
            node.ordered
              ? "list-decimal list-inside mb-2 space-y-0.5"
              : "list-disc list-inside mb-2 space-y-0.5"
          }
        >
          {node.children.map((item, i) =>
            renderBlock(
              item as RootContent,
              `${keyPrefix}-li-${i}`,
              highlights,
              styleClasses,
              isMarkupEnabled,
              onCharClick,
            ),
          )}
        </ListTag>
      );
    }
    case "listItem": {
      const checkbox =
        typeof node.checked === "boolean" ? (
          <span className="mr-1 inline-block w-4 text-center">
            {node.checked ? "☑" : "☐"}
          </span>
        ) : null;
      return (
        <li key={keyPrefix} className="leading-relaxed">
          {checkbox}
          {node.children.map((c, i) =>
            renderBlock(
              c as RootContent,
              `${keyPrefix}-lic-${i}`,
              highlights,
              styleClasses,
              isMarkupEnabled,
              onCharClick,
            ),
          )}
        </li>
      );
    }
    case "code":
      return (
        <pre
          key={keyPrefix}
          className="my-2 p-3 bg-gray-100 rounded-lg overflow-x-auto text-sm"
        >
          <code className={node.lang ? `language-${node.lang}` : undefined}>
            {renderLiteralChars(
              node,
              keyPrefix,
              highlights,
              styleClasses,
              isMarkupEnabled,
              onCharClick,
            )}
          </code>
        </pre>
      );
    case "math":
      return (
        <div key={keyPrefix}>
          <MathBlock latex={node.value} />
        </div>
      );
    case "thematicBreak":
      return <hr key={keyPrefix} className="my-4 border-gray-300" />;
    case "table": {
      const align = node.align || [];
      return (
        <div key={keyPrefix} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <tbody>
              {node.children.map((row, ri) => (
                <tr key={`${keyPrefix}-r-${ri}`} className="border-b border-gray-200">
                  {row.children.map((cell, ci) => {
                    const Tag = ri === 0 ? "th" : "td";
                    const a = align[ci];
                    const alignClass =
                      a === "center"
                        ? "text-center"
                        : a === "right"
                          ? "text-right"
                          : "text-left";
                    return (
                      <Tag
                        key={`${keyPrefix}-c-${ri}-${ci}`}
                        className={`border border-gray-300 px-3 py-2 ${alignClass} ${
                          ri === 0 ? "bg-gray-100 font-semibold" : "text-gray-700"
                        }`}
                      >
                        {cell.children.map((c, i) =>
                          renderBlock(
                            c as RootContent,
                            `${keyPrefix}-cell-${ri}-${ci}-${i}`,
                            highlights,
                            styleClasses,
                            isMarkupEnabled,
                            onCharClick,
                          ),
                        )}
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "html":
      return (
        <div
          key={keyPrefix}
          className="my-2"
          dangerouslySetInnerHTML={{ __html: node.value }}
        />
      );
    case "yaml":
      return null;
    default: {
      const anyNode = node as { children?: RootContent[] };
      const blockKids = anyNode.children;
      if (blockKids && Array.isArray(blockKids)) {
        return (
          <div key={keyPrefix} className="my-1">
            {blockKids.map((c, i) =>
              renderBlock(
                c,
                `${keyPrefix}-x-${i}`,
                highlights,
                styleClasses,
                isMarkupEnabled,
                onCharClick,
              ),
            )}
          </div>
        );
      }
      return null;
    }
  }
}

export interface MarkdownWithCharHighlightsProps {
  markdown: string;
  highlights: Record<number, CharHighlightStyle[]>;
  isMarkupEnabled: boolean;
  onCharClick?: (index: number) => void;
  containerRef?: React.Ref<HTMLDivElement>;
  onMouseUp?: () => void;
  className?: string;
  styleClasses?: Record<CharHighlightStyle, string>;
}

/**
 * Admin markdown (bold, italic, list, jadval, math) + highlight indekslari
 * bir xil manba qatoriga nisbatan saqlangan bo‘lsa, ikkalasi birga ko‘rinadi.
 */
export function MarkdownWithCharHighlights({
  markdown,
  highlights,
  isMarkupEnabled,
  onCharClick,
  containerRef,
  onMouseUp,
  className = "",
  styleClasses = defaultStyleClasses,
}: MarkdownWithCharHighlightsProps) {
  const root = useMemo(() => parseMd(markdown), [markdown]);

  const baseClass = `markdown-content text-sm sm:text-base text-gray-900 leading-relaxed [&_strong]:font-semibold [&_em]:italic ${className}`;
  const spanBase =
    "inline align-baseline decoration-inherit [box-decoration-break:clone] [-webkit-box-decoration-break:clone]";

  if (!root) {
    return (
      <div ref={containerRef} onMouseUp={onMouseUp} className={baseClass}>
        {markdown.split("").map((char, index) => {
          const styles = highlights[index] || [];
          const combinedClass = styles
            .map((s) => styleClasses[s])
            .filter(Boolean)
            .join(" ");
          const padForBg = styles.some((s) => BG_HIGHLIGHT_STYLES.has(s))
            ? "px-[1px] py-px"
            : "";
          return (
            <span
              key={index}
              data-char-index={index}
              onClick={
                isMarkupEnabled && onCharClick
                  ? () => onCharClick(index)
                  : undefined
              }
              className={`${spanBase} ${padForBg} ${isMarkupEnabled ? "cursor-pointer" : ""} ${combinedClass}`.trim()}
            >
              {char === "\n" ? <br /> : char}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} onMouseUp={onMouseUp} className={baseClass}>
      {root.children.map((child, i) =>
        renderBlock(
          child,
          `md-${i}`,
          highlights,
          styleClasses,
          isMarkupEnabled,
          onCharClick,
        ),
      )}
    </div>
  );
}
