import { describe, expect, it } from 'vitest';
import { computeWindow } from './virtual';

const base = { viewportHeight: 100, rowHeight: 10, total: 1000, overscan: 2 };

describe('computeWindow', () => {
  it('at the top renders the visible rows plus overscan below', () => {
    const w = computeWindow({ ...base, scrollTop: 0 });
    expect(w.start).toBe(0);
    expect(w.end).toBe(12); // 10 visible + 2 overscan
    expect(w.offsetTop).toBe(0);
    expect(w.totalHeight).toBe(10_000);
  });

  it('in the middle adds overscan on both sides', () => {
    const w = computeWindow({ ...base, scrollTop: 500 }); // row 50 at the top
    expect(w.start).toBe(48);
    expect(w.end).toBe(62);
    expect(w.offsetTop).toBe(480);
  });

  it('never goes past the end of the list', () => {
    const w = computeWindow({ ...base, scrollTop: 9_900 });
    expect(w.end).toBe(1000);
    expect(w.start).toBeLessThan(1000);
  });

  it('renders only the rows that exist when the list is short', () => {
    const w = computeWindow({ ...base, total: 3, scrollTop: 0 });
    expect(w.start).toBe(0);
    expect(w.end).toBe(3);
  });

  it('handles an empty list and bad scroll values', () => {
    expect(computeWindow({ ...base, total: 0, scrollTop: 0 })).toEqual({ start: 0, end: 0, offsetTop: 0, totalHeight: 0 });
    expect(computeWindow({ ...base, scrollTop: -50 }).start).toBe(0);
    expect(computeWindow({ ...base, scrollTop: NaN }).start).toBe(0);
  });

  it('renders far fewer rows than the list holds', () => {
    const w = computeWindow({ ...base, scrollTop: 4_000 });
    expect(w.end - w.start).toBeLessThan(20);
  });
});
