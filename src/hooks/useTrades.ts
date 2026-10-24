import { useEffect, useRef, useState } from 'react';
import { tradeStreamUrl } from '../lib/binance';
import { createBatcher } from '../lib/batcher';
import { countMessage } from '../lib/perf';
import { createSocket } from '../lib/socket';
import { parseAggTrade, prependTrades, type Trade } from '../lib/trades';

export const MAX_TRADES = 2000;

/** Recent trades for one symbol, newest first, capped at MAX_TRADES. */
export function useTrades(symbol: string, batching: boolean) {
  const [trades, setTrades] = useState<Trade[]>([]);

  const batchingRef = useRef(batching);
  useEffect(() => {
    batchingRef.current = batching;
  }, [batching]);

  useEffect(() => {
    setTrades([]);
    const batcher = createBatcher<Trade>(
      // every trade matters (unlike the book snapshot), so all collected items are added
      (items) => setTrades((prev) => prependTrades(prev, items, MAX_TRADES)),
      () => batchingRef.current,
    );
    const stop = createSocket(tradeStreamUrl(symbol), {
      onMessage: (msg) => {
        countMessage('trades');
        const trade = parseAggTrade(msg);
        if (trade) batcher.push(trade);
      },
    });
    return () => {
      stop();
      batcher.dispose();
    };
  }, [symbol]);

  return trades;
}
