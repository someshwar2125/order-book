# Order Book

A live **order book, market depth chart and trade tape** built with **React, TypeScript and WebSockets**, with an on-screen **performance panel** so you can see the effect of each optimisation. Live Binance data, no API key.

**Live demo:** _add your Vercel link here_

## What it shows

- Order book: top 15 asks and bids, cumulative totals, depth bars, mid price and spread
- Depth chart: cumulative size against price, drawn as SVG step areas from the same data
- Trade tape: last 2,000 trades (green = taker bought, red = taker sold)
- Perf bar with two switches and live counters:
  - **Batch updates**: collect incoming messages and render once per animation frame
  - **Virtualize trade list**: only render the rows you can see
  - Counters: messages per second vs renders per second, and how many DOM rows the tape has

## Try the experiments (this is the point of the project)

1. Leave both switches on. Note the numbers.
2. Turn **Batch updates** off. Tape renders per second jump to roughly one per message.
3. Turn **Virtualize** off. The tape goes from ~22 DOM rows to ~1,000+, and the page gets visibly heavier.
4. Switch symbol and watch everything reset cleanly (sockets closed, state cleared).

Example from a test run (simulated feed of ~100 trades/s in headless Chrome; your numbers will differ):

| Batching | Virtualize | Trade msgs/s | Tape renders/s | Tape DOM rows |
|---|---|---|---|---|
| on | on | 96 | 50 | 22 |
| off | on | 98 | 98 | 22 |
| off | off | 35 | 32 | ~850 |

With virtualization off, the main thread is so busy that the page cannot even keep up with the incoming messages.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 29 unit tests
npm run build
npm run typecheck
```

## Structure

```
src/
  lib/
    orderbook.ts   parse depth, cumulative totals, spread, depth-chart SVG paths (pure)
    trades.ts      parse aggTrade, prepend with de-duplication and a cap (pure)
    virtual.ts     which rows are visible for a scroll position (pure)
    batcher.ts     collect items, flush once per frame (injectable scheduler)
    socket.ts      reconnecting WebSocket (exponential backoff)
    perf.ts        counters for the perf bar
  hooks/
    useOrderBook.ts  depth stream -> latest snapshot (coalesced)
    useTrades.ts     trade stream -> capped list (every trade kept)
    useRenderCount.ts counts committed renders for the perf bar
  components/
    OrderBook, DepthChart, TradeTape, PerfBar   (all wrapped in React.memo)
  App.tsx
```

## Key ideas (interview material)

1. **Coalescing vs accumulating.** The depth stream sends a full snapshot every 100 ms, so if two arrive in one frame only the last matters (drop the rest). Trades are different: every trade must be kept, so they are accumulated and added together.
2. **Batching with `requestAnimationFrame`.** However fast messages arrive, the UI updates at most once per frame. The scheduler is injectable, so the batcher is unit tested with a fake scheduler and no timers.
3. **Virtualisation.** `computeWindow` turns the scroll position into a `[start, end)` range plus an offset. A tall spacer keeps the scrollbar honest and the visible rows are moved into place with `translateY`. The scroll position is also corrected when new rows are added at the top, so the rows you are reading do not jump.
4. **`React.memo` on panels.** Trade updates re-render `App`; without `memo` the order book and depth chart would re-render with every trade even though their data did not change. The perf bar proves it: book renders equal book messages.
5. **De-duplication.** Trade ids only increase, so anything not newer than the newest trade we hold is a replay (for example after a reconnect) and is ignored. This also keeps React keys unique.
6. **Pure maths separated from React.** Parsing, cumulative totals, spread, SVG path generation, windowing and batching are all plain functions with tests.
7. **Counting renders honestly.** `useRenderCount` counts in an effect (committed renders), not in the render body, so React StrictMode's extra development render does not inflate the numbers.

## Learn it by changing it

1. Show a **level selector** (10 / 15 / 20 rows) and make the depth chart use the same number.
2. **Flash** a row when its size changes (compare to the previous snapshot).
3. Throttle the order book to 4 updates/s with a toggle, and compare renders.
4. Replace the partial-depth stream with the **diff depth stream + REST snapshot** and maintain the book yourself (harder, and what real exchanges require).
5. Add a **Web Worker** to do the parsing off the main thread.

## Resume bullets

- Built a real-time order book, depth chart and trade tape (React, TypeScript, WebSockets) handling ~100 messages/s; added an in-app performance panel to measure renders per second and DOM size.
- Cut tape renders ~50% with requestAnimationFrame batching and rendered 22 rows instead of ~1,000 via list virtualisation; used React.memo so book updates and trade updates stay independent.
- Wrote 29 unit tests for pure logic (depth parsing, depth-chart geometry, windowing, batching with a fake scheduler, trade de-duplication).

## Notes

- If Binance hosts are blocked on your network, change `WS_BASE` in `src/lib/binance.ts` to `wss://stream.binance.com:9443`.
- This uses Binance's partial-depth stream (a full top-20 snapshot every 100 ms). Production exchanges use diff streams; see the "learn" list.
