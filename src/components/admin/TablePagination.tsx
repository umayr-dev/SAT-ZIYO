"use client";

import { Button } from "@/src/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPaginationItems } from "@/src/utils/pagination";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  /** Orange active style (admin users). Default uses primary button variant. */
  activeTone?: "orange" | "default";
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  activeTone = "orange",
  className = "",
}: TablePaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const safeCurrent = Math.min(Math.max(1, currentPage), safeTotal);
  const items = getPaginationItems(safeCurrent, safeTotal);

  if (safeTotal <= 1) return null;

  const activePageClass =
    activeTone === "orange"
      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
      : "";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 ${className}`}
    >
      <p className="text-sm text-gray-600 order-2 sm:order-1 sm:mr-auto">
        Page {safeCurrent} of {safeTotal}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap justify-center order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, safeCurrent - 1))}
          disabled={safeCurrent === 1 || loading}
          className="flex items-center gap-1 shrink-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1 flex-wrap justify-center max-w-[min(100%,320px)] sm:max-w-none">
          {items.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="px-1.5 text-gray-400 select-none text-sm"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={safeCurrent === item ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(item)}
                disabled={loading}
                aria-label={`Page ${item}`}
                aria-current={safeCurrent === item ? "page" : undefined}
                className={`min-w-9 h-9 px-2 shrink-0 ${
                  safeCurrent === item ? activePageClass : ""
                }`}
              >
                {item}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(safeTotal, safeCurrent + 1))}
          disabled={safeCurrent === safeTotal || loading}
          className="flex items-center gap-1 shrink-0"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
