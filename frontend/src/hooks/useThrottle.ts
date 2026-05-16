import { useCallback, useEffect, useRef } from 'react';
import { THROTTLE_MS } from '@/utils/constants';

export function useThrottleFn<T extends (...args: never[]) => void>(
  fn: T,
  delay = THROTTLE_MS,
): T {
  const last = useRef(0);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - last.current >= delay) {
        last.current = now;
        fnRef.current(...args);
      }
    },
    [delay],
  ) as T;
}
