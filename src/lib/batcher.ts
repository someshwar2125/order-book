/**
 * Batches bursts of incoming items into one flush per animation frame.
 *
 * Why: a WebSocket can deliver dozens of messages per second. If every message calls
 * setState, React renders once per message. With a batcher, messages are collected and
 * the UI updates at most once per frame (~60/s), however fast data arrives.
 */
export interface Scheduler {
  request: (cb: () => void) => number;
  cancel: (id: number) => void;
}

// Looked up lazily so this module can be imported (and tested) in Node, where there is no window.
export const rafScheduler: Scheduler = {
  request: (cb) => requestAnimationFrame(() => cb()),
  cancel: (id) => cancelAnimationFrame(id),
};

export interface Batcher<T> {
  push: (item: T) => void;
  dispose: () => void;
  pending: () => number;
}

/**
 * @param onFlush  called with every item collected since the last flush (oldest first)
 * @param enabled  read on every push, so batching can be switched on/off live
 */
export function createBatcher<T>(
  onFlush: (items: T[]) => void,
  enabled: () => boolean,
  scheduler: Scheduler = rafScheduler,
): Batcher<T> {
  let buffer: T[] = [];
  let handle: number | null = null;

  const flush = () => {
    handle = null;
    if (buffer.length === 0) return;
    const items = buffer;
    buffer = [];
    onFlush(items);
  };

  return {
    push(item) {
      if (!enabled()) {
        onFlush([item]); // batching off: one update per message
        return;
      }
      buffer.push(item);
      if (handle === null) handle = scheduler.request(flush);
    },
    dispose() {
      if (handle !== null) scheduler.cancel(handle);
      handle = null;
      buffer = [];
    },
    pending: () => buffer.length,
  };
}
