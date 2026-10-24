import { describe, expect, it } from 'vitest';
import { buildDepthPaths, parseDepth, spreadOf, withCumulative } from './orderbook';

const msg = {
  lastUpdateId: 1,
  bids: [['99', '2'], ['100', '1'], ['98', '3']], // deliberately unsorted
  asks: [['102', '1.5'], ['101', '1']],
};

describe('parseDepth', () => {
  it('parses numbers and sorts best-first', () => {
    const b = parseDepth(msg);
    expect(b?.bids.map((l) => l.price)).toEqual([100, 99, 98]);
    expect(b?.asks.map((l) => l.price)).toEqual([101, 102]);
    expect(b?.bids[0]).toEqual({ price: 100, qty: 1 });
  });

  it('rejects malformed messages', () => {
    expect(parseDepth(null)).toBeNull();
    expect(parseDepth({})).toBeNull();
    expect(parseDepth({ bids: [['1', '1']], asks: [] })).toBeNull(); // empty side
    expect(parseDepth({ bids: [['x', '1']], asks: [['2', '1']] })).toBeNull(); // not a number
    expect(parseDepth({ bids: [['1']], asks: [['2', '1']] })).toBeNull(); // missing qty
    expect(parseDepth({ bids: [['-1', '1']], asks: [['2', '1']] })).toBeNull(); // negative price
  });
});

describe('withCumulative', () => {
  it('adds a running total', () => {
    const rows = withCumulative([{ price: 10, qty: 1 }, { price: 9, qty: 2 }, { price: 8, qty: 0.5 }]);
    expect(rows.map((r) => r.total)).toEqual([1, 3, 3.5]);
  });

  it('handles an empty list', () => {
    expect(withCumulative([])).toEqual([]);
  });
});

describe('spreadOf', () => {
  it('computes mid, absolute and percentage spread', () => {
    const s = spreadOf(parseDepth(msg)!);
    expect(s.bid).toBe(100);
    expect(s.ask).toBe(101);
    expect(s.mid).toBe(100.5);
    expect(s.abs).toBe(1);
    expect(s.pct).toBeCloseTo((1 / 100.5) * 100, 6);
  });
});

describe('buildDepthPaths', () => {
  const book = parseDepth(msg)!;
  const bids = withCumulative(book.bids); // totals 1, 3, 6
  const asks = withCumulative(book.asks); // totals 1, 2.5

  it('returns null when a side is empty', () => {
    expect(buildDepthPaths([], asks, 600, 200)).toBeNull();
    expect(buildDepthPaths(bids, [], 600, 200)).toBeNull();
  });

  it('scales price to x and the largest total to the top', () => {
    const p = buildDepthPaths(bids, asks, 600, 200)!;
    expect(p.minPrice).toBe(98);
    expect(p.maxPrice).toBe(102);
    expect(p.maxTotal).toBe(6);
    expect(p.bidPath.startsWith('M')).toBe(true);
    expect(p.bidPath.endsWith('Z')).toBe(true);
    expect(p.bidPath).toContain(',0.00'); // total 6 (the max) maps to y = 0, the top
  });

  it('puts the mid line between the best bid and best ask', () => {
    const p = buildDepthPaths(bids, asks, 600, 200)!;
    // mid = 100.5, range 98..102 => x = (2.5 / 4) * 600
    expect(p.midX).toBeCloseTo(375, 5);
  });

  it('keeps every coordinate inside the chart', () => {
    const p = buildDepthPaths(bids, asks, 600, 200)!;
    const nums = (p.bidPath + ' ' + p.askPath).match(/-?\d+\.\d+/g)!.map(Number);
    for (const n of nums) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(600);
    }
  });
});
