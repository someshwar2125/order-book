/** Order book maths. Pure functions: no React, no network. */

export interface Level {
  price: number;
  qty: number;
}

export interface Book {
  bids: Level[]; // best (highest) price first
  asks: Level[]; // best (lowest) price first
}

export interface BookRow extends Level {
  total: number; // cumulative quantity from the best price down to this level
}

function parseLevels(v: unknown): Level[] | null {
  if (!Array.isArray(v)) return null;
  const out: Level[] = [];
  for (const row of v) {
    if (!Array.isArray(row) || row.length < 2) return null;
    const price = Number(row[0]);
    const qty = Number(row[1]);
    if (!Number.isFinite(price) || !Number.isFinite(qty) || price <= 0 || qty < 0) return null;
    out.push({ price, qty });
  }
  return out;
}

/** Parse a Binance partial-depth message. Returns null if anything is malformed or a side is empty. */
export function parseDepth(data: unknown): Book | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const bids = parseLevels(d.bids);
  const asks = parseLevels(d.asks);
  if (!bids || !asks || bids.length === 0 || asks.length === 0) return null;
  bids.sort((a, b) => b.price - a.price); // defensive: guarantee best-first order
  asks.sort((a, b) => a.price - b.price);
  return { bids, asks };
}

/** Add a running total of quantity to each level (best price first). */
export function withCumulative(levels: Level[]): BookRow[] {
  let total = 0;
  return levels.map((l) => {
    total += l.qty;
    return { price: l.price, qty: l.qty, total };
  });
}

export interface Spread {
  bid: number;
  ask: number;
  mid: number;
  abs: number;
  pct: number; // spread as a percentage of the mid price
}

export function spreadOf(book: Book): Spread {
  const bid = book.bids[0].price;
  const ask = book.asks[0].price;
  const mid = (bid + ask) / 2;
  const abs = ask - bid;
  return { bid, ask, mid, abs, pct: (abs / mid) * 100 };
}

export interface DepthPaths {
  bidPath: string;
  askPath: string;
  midX: number;
  minPrice: number;
  maxPrice: number;
  maxTotal: number;
}

function stepPath(rows: BookRow[], x: (p: number) => number, y: (t: number) => number, height: number): string {
  const f = (n: number) => n.toFixed(2);
  const parts: string[] = [`M${f(x(rows[0].price))},${f(height)}`, `L${f(x(rows[0].price))},${f(y(rows[0].total))}`];
  for (let i = 1; i < rows.length; i++) {
    // hold the previous total until the next price, then step up to the new total
    parts.push(`L${f(x(rows[i].price))},${f(y(rows[i - 1].total))}`);
    parts.push(`L${f(x(rows[i].price))},${f(y(rows[i].total))}`);
  }
  parts.push(`L${f(x(rows[rows.length - 1].price))},${f(height)}`, 'Z');
  return parts.join(' ');
}

/**
 * SVG path data for a depth chart: cumulative size (y) against price (x).
 * Bids step up to the left of the mid price, asks step up to the right.
 */
export function buildDepthPaths(bids: BookRow[], asks: BookRow[], width: number, height: number): DepthPaths | null {
  if (bids.length === 0 || asks.length === 0) return null;
  const minPrice = bids[bids.length - 1].price;
  const maxPrice = asks[asks.length - 1].price;
  const maxTotal = Math.max(bids[bids.length - 1].total, asks[asks.length - 1].total) || 1;
  const span = maxPrice - minPrice || 1;

  const x = (p: number) => ((p - minPrice) / span) * width;
  const y = (t: number) => height - (t / maxTotal) * height;

  return {
    bidPath: stepPath(bids, x, y, height),
    askPath: stepPath(asks, x, y, height),
    midX: x((bids[0].price + asks[0].price) / 2),
    minPrice,
    maxPrice,
    maxTotal,
  };
}
