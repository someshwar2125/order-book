import { memo, useMemo } from 'react';
import { spreadOf, withCumulative, type Book } from '../lib/orderbook';
import { formatPrice, formatQty } from '../lib/format';
import { useRenderCount } from '../hooks/useRenderCount';

const LEVELS = 15; // rows shown per side

interface RowProps {
  price: number;
  qty: number;
  total: number;
  max: number;
  side: 'bid' | 'ask';
}

// memo: a row is skipped when its price, qty and total are unchanged since the last snapshot
const Row = memo(function Row({ price, qty, total, max, side }: RowProps) {
  return (
    <div className={`ob-row ${side}`}>
      <div className="bar" style={{ width: `${max > 0 ? (total / max) * 100 : 0}%` }} />
      <span className="p">{formatPrice(price)}</span>
      <span>{formatQty(qty)}</span>
      <span>{formatQty(total)}</span>
    </div>
  );
});

function OrderBook({ book }: { book: Book | null }) {
  useRenderCount('OrderBook');

  const view = useMemo(() => {
    if (!book) return null;
    const bids = withCumulative(book.bids.slice(0, LEVELS));
    const asks = withCumulative(book.asks.slice(0, LEVELS));
    const max = Math.max(bids[bids.length - 1].total, asks[asks.length - 1].total);
    return { bids, asks: asks.slice().reverse(), max, spread: spreadOf(book) };
  }, [book]);

  return (
    <section className="panel">
      <h2>Order book</h2>
      <div className="ob-head">
        <span>Price (USDT)</span>
        <span>Size</span>
        <span>Total</span>
      </div>
      {!view ? (
        <p className="muted">Waiting for data...</p>
      ) : (
        <>
          {view.asks.map((r) => (
            <Row key={r.price} price={r.price} qty={r.qty} total={r.total} max={view.max} side="ask" />
          ))}
          <div className="ob-mid">
            <strong>{formatPrice(view.spread.mid)}</strong>
            <span className="muted">
              spread {formatPrice(view.spread.abs)} ({view.spread.pct.toFixed(4)}%)
            </span>
          </div>
          {view.bids.map((r) => (
            <Row key={r.price} price={r.price} qty={r.qty} total={r.total} max={view.max} side="bid" />
          ))}
        </>
      )}
    </section>
  );
}

// memo: skip re-rendering when props are unchanged (e.g. the book does not re-render on every trade)
export default memo(OrderBook);
