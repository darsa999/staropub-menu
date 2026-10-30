import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a `schedule(fn, ms)` function whose pending timer is cleared on unmount
 * (and replaced when schedule is called again).
 */
export function useTimeout() {
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback((fn, ms) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);
}
