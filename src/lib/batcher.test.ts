import { describe, expect, it } from 'vitest';
import { createBatcher, type Scheduler } from './batcher';

/** A fake animation-frame scheduler we can trigger by hand. */
function fakeScheduler() {
  const queue = new Map<number, () => void>();
  let nextId = 1;
  const scheduler: Scheduler = {
    request: (cb) => {
      const id = nextId++;
      queue.set(id, cb);
      return id;
    },
    cancel: (id) => {
      queue.delete(id);
    },
  };
  const runFrame = () => {
    const cbs = [...queue.values()];
    queue.clear();
    cbs.forEach((cb) => cb());
  };
  return { scheduler, runFrame, size: () => queue.size };
}

describe('createBatcher', () => {
  it('collects many pushes into a single flush per frame', () => {
    const flushes: number[][] = [];
    const { scheduler, runFrame } = fakeScheduler();
    const b = createBatcher<number>((items) => flushes.push(items), () => true, scheduler);

    b.push(1);
    b.push(2);
    b.push(3);
    expect(flushes).toHaveLength(0); // nothing yet: waiting for the frame
    expect(b.pending()).toBe(3);

    runFrame();
    expect(flushes).toEqual([[1, 2, 3]]);
    expect(b.pending()).toBe(0);
  });

  it('schedules only one frame however many items arrive', () => {
    const { scheduler, size } = fakeScheduler();
    const b = createBatcher<number>(() => {}, () => true, scheduler);
    b.push(1);
    b.push(2);
    b.push(3);
    expect(size()).toBe(1);
  });

  it('starts a new batch after a flush', () => {
    const flushes: number[][] = [];
    const { scheduler, runFrame } = fakeScheduler();
    const b = createBatcher<number>((items) => flushes.push(items), () => true, scheduler);
    b.push(1);
    runFrame();
    b.push(2);
    b.push(3);
    runFrame();
    expect(flushes).toEqual([[1], [2, 3]]);
  });

  it('flushes immediately, one item at a time, when disabled', () => {
    const flushes: number[][] = [];
    const { scheduler, size } = fakeScheduler();
    const b = createBatcher<number>((items) => flushes.push(items), () => false, scheduler);
    b.push(1);
    b.push(2);
    expect(flushes).toEqual([[1], [2]]);
    expect(size()).toBe(0);
  });

  it('can be switched on and off live', () => {
    let on = true;
    const flushes: number[][] = [];
    const { scheduler, runFrame } = fakeScheduler();
    const b = createBatcher<number>((items) => flushes.push(items), () => on, scheduler);
    b.push(1);
    on = false;
    b.push(2); // immediate
    runFrame(); // the buffered item from before is still delivered
    expect(flushes).toEqual([[2], [1]]);
  });

  it('dispose cancels the pending frame and drops buffered items', () => {
    const flushes: number[][] = [];
    const { scheduler, runFrame, size } = fakeScheduler();
    const b = createBatcher<number>((items) => flushes.push(items), () => true, scheduler);
    b.push(1);
    b.dispose();
    expect(size()).toBe(0);
    runFrame();
    expect(flushes).toHaveLength(0);
  });
});
