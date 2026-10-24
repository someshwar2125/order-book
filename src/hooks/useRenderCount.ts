import { useEffect } from 'react';
import { countRender } from '../lib/perf';

/**
 * Counts how many times a component has COMMITTED a render (runs after every render).
 * Counting in an effect, not in the render body, keeps render pure and ignores the extra
 * render React's StrictMode does in development.
 */
export function useRenderCount(name: string) {
  useEffect(() => {
    countRender(name);
  });
}
