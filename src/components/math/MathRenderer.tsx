"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

export function MathRenderer({
  content,
  displayMode = false,
  className = "",
}: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Render LaTeX content with KaTeX
      katex.render(content, containerRef.current, {
        displayMode,
        throwOnError: false,
        errorColor: "#cc0000",
      });
    } catch (error) {
      console.error("KaTeX render error:", error);
      // Fallback: show plain text on error
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content, displayMode]);

  return <div ref={containerRef} className={className} />;
}
