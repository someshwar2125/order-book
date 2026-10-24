import { useState } from 'react';
import DepthChart from './components/DepthChart';
import OrderBook from './components/OrderBook';
import PerfBar from './components/PerfBar';
import TradeTape from './components/TradeTape';
import { useOrderBook } from './hooks/useOrderBook';
import { useTrades } from './hooks/useTrades';
import { prettySymbol } from './lib/format';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
const STATUS_LABEL = { connecting: 'Connecting...', open: 'Live', reconnecting: 'Reconnecting...' } as const;

export default function App() {
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [batching, setBatching] = useState(true);
  const [virtualize, setVirtualize] = useState(true);

  const { book, status } = useOrderBook(symbol, batching);
  const trades = useTrades(symbol, batching);

  return (
    <div className="app">
      <header>
        <div className="title">
          <h1>Order Book</h1>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} aria-label="Symbol">
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {prettySymbol(s)}
              </option>
            ))}
          </select>
        </div>
        <span className={`status ${status}`}>
          <span className="dot" /> {STATUS_LABEL[status]}
        </span>
      </header>

      <PerfBar batching={batching} onBatching={setBatching} virtualize={virtualize} onVirtualize={setVirtualize} />

      <main>
        <OrderBook book={book} />
        <div className="stack">
          <DepthChart book={book} />
          <TradeTape trades={trades} virtualize={virtualize} />
        </div>
      </main>

      <footer>
        Live Binance data. Turn the two switches off and watch the render rate and DOM row count change.
      </footer>
    </div>
  );
}
