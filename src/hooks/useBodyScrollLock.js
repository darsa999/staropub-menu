import { useEffect } from "react";

// Shared counter so overlapping drawers/modals don't unlock each other's scroll.
let lockCount = 0;

export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined;
    lockCount += 1;
    document.body.style.overflow = "hidden";
    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = "";
    };
  }, [isLocked]);
}
