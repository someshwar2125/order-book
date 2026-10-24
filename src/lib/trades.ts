export interface Trade {
  id: number;
  price: number;
  qty: number;
  time: number; // ms since epoch
  side: 'buy' | 'sell'; // the side of the TAKER (the aggressor)
}

/** Parse a Binance aggTrade message. Returns null if malformed. */
export function parseAggTrade(data: unknown): Trade | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const id = Number(d.a);
  const price = Number(d.p);
  const qty = Number(d.q);
  const time = Number(d.T);
  if (![id, price, qty, time].every(Number.isFinite) || price <= 0 || qty <= 0) return null;
  // m = "buyer is the maker": the buyer was resting, so the taker (aggressor) was SELLING.
  return { id, price, qty, time, side: d.m === true ? 'sell' : 'buy' };
}

/**
 * Add newly arrived trades (oldest first) to the front of the list (newest first),
 * keeping at most `max` entries. Returns a new array.
 *
 * Trade ids only ever increase, so anything not newer than the newest trade we already
 * hold is a duplicate or a replay (for example after a reconnect) and is ignored.
 */
export function prependTrades(list: Trade[], incoming: Trade[], max: number): Trade[] {
  let latest = list.length > 0 ? list[0].id : -Infinity;
  const fresh: Trade[] = [];
  for (const t of incoming) {
    if (t.id > latest) {
      fresh.push(t);
      latest = t.id;
    }
  }
  if (fresh.length === 0) return list;
  return fresh.reverse().concat(list).slice(0, max);
}
