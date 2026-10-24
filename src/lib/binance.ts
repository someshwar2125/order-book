/** Binance public market-data (no API key). Swap hosts here if blocked on your network. */
export const WS_BASE = 'wss://data-stream.binance.vision';

/** Partial book depth: top `levels` bids and asks, pushed every 100ms as a full snapshot. */
export function depthStreamUrl(symbol: string, levels = 20): string {
  return `${WS_BASE}/ws/${symbol.toLowerCase()}@depth${levels}@100ms`;
}

/** Aggregate trades: one message per taker order (many fills merged). */
export function tradeStreamUrl(symbol: string): string {
  return `${WS_BASE}/ws/${symbol.toLowerCase()}@aggTrade`;
}
