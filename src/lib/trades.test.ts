import { describe, expect, it } from 'vitest';
import { parseAggTrade, prependTrades, type Trade } from './trades';

const t = (id: number): Trade => ({ id, price: 100, qty: 1, time: id, side: 'buy' });

describe('parseAggTrade', () => {
  const raw = { e: 'aggTrade', a: 5, p: '100.5', q: '0.25', T: 1700000000000, m: false };

  it('parses a taker buy', () => {
    expect(parseAggTrade(raw)).toEqual({ id: 5, price: 100.5, qty: 0.25, time: 1700000000000, side: 'buy' });
  });

  it('treats buyer-is-maker as a taker SELL', () => {
    expect(parseAggTrade({ ...raw, m: true })?.side).toBe('sell');
  });

  it('rejects malformed trades', () => {
    expect(parseAggTrade(null)).toBeNull();
    expect(parseAggTrade({ ...raw, p: 'abc' })).toBeNull();
    expect(parseAggTrade({ ...raw, q: '0' })).toBeNull();
    expect(parseAggTrade({})).toBeNull();
  });
});

describe('prependTrades', () => {
  it('puts the newest incoming trade first', () => {
    const out = prependTrades([t(1)], [t(2), t(3)], 10); // incoming is oldest-first
    expect(out.map((x) => x.id)).toEqual([3, 2, 1]);
  });

  it('caps the list length, dropping the oldest', () => {
    const out = prependTrades([t(2), t(1)], [t(3), t(4)], 3);
    expect(out.map((x) => x.id)).toEqual([4, 3, 2]);
  });

  it('ignores duplicates and replays (ids that are not newer)', () => {
    const list = [t(5), t(4)];
    expect(prependTrades(list, [t(4), t(5)], 10)).toBe(list); // all stale: same array back
    const out = prependTrades(list, [t(3), t(6), t(6), t(7)], 10);
    expect(out.map((x) => x.id)).toEqual([7, 6, 5, 4]);
  });

  it('returns the same array when nothing arrived', () => {
    const list = [t(1)];
    expect(prependTrades(list, [], 10)).toBe(list);
  });

  it('does not mutate its inputs', () => {
    const list = [t(1)];
    const incoming = [t(2), t(3)];
    prependTrades(list, incoming, 10);
    expect(list).toHaveLength(1);
    expect(incoming.map((x) => x.id)).toEqual([2, 3]);
  });
});
