/**
 * Resolve highlight/markup character range from a DOM text selection.
 * Uses [data-char-index] spans inside the container (works with rendered markdown).
 */
export function resolveMarkupSelectionRange(
  container: HTMLElement,
  range: Range,
): { from: number; to: number } | null {
  if (!container.contains(range.commonAncestorContainer)) {
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const overlaps =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.left < containerRect.right &&
      rect.right > containerRect.left &&
      rect.top < containerRect.bottom &&
      rect.bottom > containerRect.top;
    if (!overlaps) return null;
  }

  const indices: number[] = [];
  const spans = container.querySelectorAll("[data-char-index]");

  spans.forEach((node) => {
    const el = node as HTMLElement;
    const index = Number(el.dataset.charIndex);
    if (Number.isNaN(index)) return;

    const spanRange = document.createRange();
    try {
      spanRange.selectNodeContents(el);
    } catch {
      return;
    }

    const endsBefore =
      range.compareBoundaryPoints(Range.END_TO_START, spanRange) <= 0;
    const startsAfter =
      range.compareBoundaryPoints(Range.START_TO_END, spanRange) >= 0;
    if (!endsBefore && !startsAfter) {
      indices.push(index);
    }
  });

  if (indices.length > 0) {
    return { from: Math.min(...indices), to: Math.max(...indices) };
  }

  const getCharSpan = (node: Node | null): HTMLSpanElement | null => {
    let current: Node | null = node;
    while (current && current !== container) {
      if (
        current instanceof HTMLElement &&
        current.dataset.charIndex !== undefined
      ) {
        return current as HTMLSpanElement;
      }
      current = current.parentNode;
    }
    return null;
  };

  const startSpan = getCharSpan(range.startContainer);
  const endSpan = getCharSpan(range.endContainer);
  if (startSpan && endSpan) {
    const from = Number(startSpan.dataset.charIndex);
    const to = Number(endSpan.dataset.charIndex);
    if (!Number.isNaN(from) && !Number.isNaN(to)) {
      return { from: Math.min(from, to), to: Math.max(from, to) };
    }
  }

  return null;
}

/** Sequential source offsets when mdast nodes lack position data. */
export class SourceOffsetAllocator {
  private next = 0;

  startFor(value: string, explicit?: number): number {
    const len = value.length;
    if (explicit !== undefined && !Number.isNaN(explicit)) {
      this.next = Math.max(this.next, explicit + len);
      return explicit;
    }
    const start = this.next;
    this.next += len;
    return start;
  }
}
