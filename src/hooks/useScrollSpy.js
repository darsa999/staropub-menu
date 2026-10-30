import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Two-way synchronized scrolling (scrollspy) backed by IntersectionObserver,
 * so no layout is read on every scroll event.
 * @param {Array<string>} sectionIds - section element IDs, in document order
 * @param {number} offset - height of the sticky header + category bar in px
 */
export function useScrollSpy(sectionIds = [], offset = 140) {
  const [activeId, setActiveId] = useState(sectionIds[0] || "");
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    if (!sectionIds.length || typeof IntersectionObserver === "undefined") return undefined;

    const visible = new Set();
    const pick = () => {
      if (isProgrammaticScrollRef.current) return;
      // Near the bottom of the page the last (often short) section can never reach the top band.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      const next = atBottom
        ? sectionIds[sectionIds.length - 1]
        : sectionIds.find((id) => visible.has(id));
      if (next) setActiveId((prev) => (prev === next ? prev : next));
    };

    // The observed band is the strip just below the sticky header.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        pick();
      },
      { rootMargin: `-${offset + 20}px 0px -55% 0px` }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    const onScrollEnd = () => pick();
    window.addEventListener("scrollend", onScrollEnd, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, [sectionIds, offset]);

  useEffect(() => () => clearTimeout(scrollTimeoutRef.current), []);

  const scrollToSection = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;

      setActiveId(id);
      isProgrammaticScrollRef.current = true;

      window.scrollTo({
        top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset),
        behavior: "smooth",
      });

      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 700);
    },
    [offset]
  );

  return { activeId, setActiveId, scrollToSection };
}
