import { memo, useLayoutEffect, useRef, useState } from 'react';
import { computeWindow } from '../lib/virtual';
import { formatPrice, formatQty, formatTime } from '../lib/format';
import { setGauge } from '../lib/perf';
import { useRenderCount } from '../hooks/useRenderCount';
import type { Trade } from '../lib/trades';

const ROW_H = 22;
const VIEW_H = 360;

const Row = memo(function Row({ trade }: { trade: Trade }) {
  return (
    <div className="tape-row" style={{ height: ROW_H }}>
      <span className="muted">{formatTime(trade.time)}</span>
      <span className={trade.side === 'buy' ? 'up' : 'down'}>{formatPrice(trade.price)}</span>
      <span>{formatQty(trade.qty)}</span>
    </div>
  );
});

interface Props {
  trades: Trade[];
  virtualize: boolean;
}

function TradeTape({ trades, virtualize }: Props) {
  useRenderCount('TradeTape');

  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const prevFirstId = useRef<number | undefined>(undefined);

  // New trades are added at the TOP. If the user has scrolled down, push scrollTop down by the
  // same amount so the rows they are reading do not jump.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && prevFirstId.current !== undefined && el.scrollTop > 0) {
      const added = trades.findIndex((t) => t.id === prevFirstId.current);
      if (added > 0) el.scrollTop += added * ROW_H;
    }
    prevFirstId.current = trades[0]?.id;
  }, [trades]);

  const win = virtualize
    ? computeWindow({ scrollTop, viewportHeight: VIEW_H, rowHeight: ROW_H, total: trades.length, overscan: 5 })
    : { start: 0, end: trades.length, offsetTop: 0, totalHeight: trades.length * ROW_H };

  const rows = trades.slice(win.start, win.end);
  setGauge('tapeRows', rows.length);

  return (
    <section className="panel">
      <h2>
        Recent trades <span className="muted small">({trades.length} kept)</span>
      </h2>
      <div className="tape-head">
        <span>Time</span>
        <span>Price</span>
        <span>Size</span>
      </div>
      <div ref={ref} className="tape" style={{ height: VIEW_H }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
        <div style={{ height: win.totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${win.offsetTop}px)` }}>
            {rows.map((t) => (
              <Row key={t.id} trade={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// memo: skip re-rendering when props are unchanged (e.g. the book does not re-render on every trade)
export default memo(TradeTape);
