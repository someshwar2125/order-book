/**
 * Tiny performance counters shown in the Perf bar.
 * Components call countRender() while rendering; sockets call countMessage() per message.
 * (Writing to a module-level counter during render is a side effect, so this is only for
 * demos and debugging, not something to ship in production code.)
 */
const counters: Record<string, number> = {};
const gauges: Record<string, number> = {};

export const countRender = (name: string) => {
  counters[`render:${name}`] = (counters[`render:${name}`] ?? 0) + 1;
};

export const countMessage = (name: string) => {
  counters[`msg:${name}`] = (counters[`msg:${name}`] ?? 0) + 1;
};

export const readCounters = (): Record<string, number> => ({ ...counters });

export const setGauge = (name: string, value: number) => {
  gauges[name] = value;
};

export const readGauge = (name: string): number => gauges[name] ?? 0;
