import { useEffect, useRef, useState } from 'react';
import { depthStreamUrl } from '../lib/binance';
import { createBatcher } from '../lib/batcher';
import { parseDepth, type Book } from '../lib/orderbook';
import { countMessage } from '../lib/perf';
import { createSocket, type ConnectionStatus } from '../lib/socket';

/**
 * Live order book for one symbol. The stream sends a full snapshot every 100ms, so when
 * several arrive within one frame only the LAST one matters (coalescing).
 */
export function useOrderBook(symbol: string, batching: boolean) {
  const [book, setBook] = useState<Book | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  // Read the latest setting without reconnecting the socket when it is toggled.
  const batchingRef = useRef(batching);
  useEffect(() => {
    batchingRef.current = batching;
  }, [batching]);

  useEffect(() => {
    setBook(null);
    const batcher = createBatcher<Book>(
      (items) => setBook(items[items.length - 1]),
      () => batchingRef.current,
    );
    const stop = createSocket(depthStreamUrl(symbol), {
      onStatus: setStatus,
      onMessage: (msg) => {
        countMessage('depth');
        const parsed = parseDepth(msg);
        if (parsed) batcher.push(parsed);
      },
    });
    return () => {
      stop();
      batcher.dispose();
    };
  }, [symbol]);

  return { book, status };
}
