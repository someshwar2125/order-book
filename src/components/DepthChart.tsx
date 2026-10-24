import { memo, useMemo } from 'react';
import { buildDepthPaths, withCumulative, type Book } from '../lib/orderbook';
import { formatPrice, formatQty } from '../lib/format';
import { useRenderCount } from '../hooks/useRenderCount';

const W = 600;
const H = 200;

function DepthChart({ book }: { book: Book | null }) {
  useRenderCount('DepthChart');

  const paths = useMemo(() => {
    if (!book) return null;
    return buildDepthPaths(withCumulative(book.bids), withCumulative(book.asks), W, H);
  }, [book]);

  return (
    <section className="panel">
      <h2>Market depth</h2>
      {!paths ? (
        <p className="muted">Waiting for data...</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="depth" role="img" aria-label="Depth chart">
            <path d={paths.bidPath} className="depth-bid" />
            <path d={paths.askPath} className="depth-ask" />
            <line x1={paths.midX} x2={paths.midX} y1={0} y2={H} className="depth-mid" />
          </svg>
          <div className="depth-axis">
            <span>{formatPrice(paths.minPrice)}</span>
            <span className="muted">max depth {formatQty(paths.maxTotal, 2)}</span>
            <span>{formatPrice(paths.maxPrice)}</span>
          </div>
        </>
      )}
    </section>
  );
}

// memo: skip re-rendering when props are unchanged (e.g. the book does not re-render on every trade)
export default memo(DepthChart);
