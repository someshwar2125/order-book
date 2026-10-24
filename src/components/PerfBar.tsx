import { memo, useEffect, useState } from 'react';
import { readCounters, readGauge } from '../lib/perf';

interface Props {
  batching: boolean;
  onBatching: (value: boolean) => void;
  virtualize: boolean;
  onVirtualize: (value: boolean) => void;
}

interface Stats {
  depthMsgs: number;
  bookRenders: number;
  tradeMsgs: number;
  tapeRenders: number;
  tapeRows: number;
}

const ZERO: Stats = { depthMsgs: 0, bookRenders: 0, tradeMsgs: 0, tapeRenders: 0, tapeRows: 0 };

/** Samples the perf counters once a second and shows per-second rates. */
function PerfBar({ batching, onBatching, virtualize, onVirtualize }: Props) {
  const [stats, setStats] = useState<Stats>(ZERO);

  useEffect(() => {
    let prev = readCounters();
    const id = setInterval(() => {
      const cur = readCounters();
      const d = (k: string) => (cur[k] ?? 0) - (prev[k] ?? 0);
      setStats({
        depthMsgs: d('msg:depth'),
        bookRenders: d('render:OrderBook'),
        tradeMsgs: d('msg:trades'),
        tapeRenders: d('render:TradeTape'),
        tapeRows: readGauge('tapeRows'),
      });
      prev = cur;
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="perf">
      <div className="toggles">
        <label>
          <input type="checkbox" checked={batching} onChange={(e) => onBatching(e.target.checked)} />
          Batch updates (one render per frame)
        </label>
        <label>
          <input type="checkbox" checked={virtualize} onChange={(e) => onVirtualize(e.target.checked)} />
          Virtualize trade list
        </label>
      </div>
      <dl className="metrics">
        <div>
          <dt>Book msgs/s</dt>
          <dd data-testid="depth-msgs">{stats.depthMsgs}</dd>
        </div>
        <div>
          <dt>Book renders/s</dt>
          <dd data-testid="book-renders">{stats.bookRenders}</dd>
        </div>
        <div>
          <dt>Trade msgs/s</dt>
          <dd data-testid="trade-msgs">{stats.tradeMsgs}</dd>
        </div>
        <div>
          <dt>Tape renders/s</dt>
          <dd data-testid="tape-renders">{stats.tapeRenders}</dd>
        </div>
        <div>
          <dt>Tape DOM rows</dt>
          <dd data-testid="tape-rows">{stats.tapeRows}</dd>
        </div>
      </dl>
    </section>
  );
}

// memo: skip re-rendering when props are unchanged (e.g. the book does not re-render on every trade)
export default memo(PerfBar);
