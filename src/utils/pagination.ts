export type PaginationItem = number | "ellipsis";

/**
 * Compact page list: always shows first/last, current ± siblings, ellipsis elsewhere.
 * e.g. 1 … 14 15 16 … 30
 */
export function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): PaginationItem[] {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total);

  if (total <= 1) return [1];

  const items: PaginationItem[] = [];

  for (let page = 1; page <= total; page++) {
    const isBoundary = page === 1 || page === total;
    const isNearCurrent =
      page >= current - siblingCount && page <= current + siblingCount;

    if (isBoundary || isNearCurrent) {
      items.push(page);
    } else if (items[items.length - 1] !== "ellipsis") {
      items.push("ellipsis");
    }
  }

  return items;
}
