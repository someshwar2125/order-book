/**
 * List virtualisation maths: given the scroll position, work out which rows are visible
 * so only those are rendered. A 2,000-row list becomes ~25 DOM nodes.
 */
export interface WindowInput {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  total: number;
  overscan?: number; // extra rows rendered above/below to avoid blank flashes while scrolling
}

export interface WindowResult {
  start: number; // first row index to render
  end: number; // one past the last row index to render
  offsetTop: number; // how far to push the rendered rows down (px)
  totalHeight: number; // full height of the list as if every row was rendered (px)
}

export function computeWindow({ scrollTop, viewportHeight, rowHeight, total, overscan = 5 }: WindowInput): WindowResult {
  const totalHeight = Math.max(0, total) * rowHeight;
  if (total <= 0 || rowHeight <= 0) return { start: 0, end: 0, offsetTop: 0, totalHeight: 0 };

  const top = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0;
  const firstVisible = Math.floor(top / rowHeight);
  const lastVisible = Math.ceil((top + viewportHeight) / rowHeight);

  const start = Math.min(total, Math.max(0, firstVisible - overscan));
  const end = Math.min(total, Math.max(start, lastVisible + overscan));
  return { start, end, offsetTop: start * rowHeight, totalHeight };
}
