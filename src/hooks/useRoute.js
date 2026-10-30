import { useCallback, useEffect, useState } from "react";

/** @typedef {"home" | "catalog" | "about" | "admin"} View */

/** @returns {View} */
function viewFromLocation() {
  const { pathname, search } = window.location;
  if (pathname.startsWith("/admin") || new URLSearchParams(search).get("admin") === "true") return "admin";
  if (pathname.startsWith("/menu")) return "catalog";
  if (pathname.startsWith("/about")) return "about";
  return "home";
}

const PATHS = { home: "/", catalog: "/menu", about: "/about", admin: "/admin" };

/**
 * Minimal History-API router so views are linkable and the back button works.
 * The query string (e.g. ?table=5 from a QR code) is preserved across navigation.
 */
export function useRoute() {
  const [view, setView] = useState(viewFromLocation);
  const [hash, setHash] = useState(() => window.location.hash.slice(1));

  useEffect(() => {
    const onPopState = () => {
      setView(viewFromLocation());
      setHash(window.location.hash.slice(1));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /** @param {View} nextView @param {{ hash?: string, replace?: boolean }} [options] */
  const navigate = useCallback((nextView, { hash: nextHash = "", replace = false } = {}) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("admin");
    const query = params.toString();
    const url = `${PATHS[nextView]}${query ? `?${query}` : ""}${nextHash ? `#${nextHash}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history[replace ? "replaceState" : "pushState"]({}, "", url);
    }
    setView(nextView);
    setHash(nextHash);
  }, []);

  return { view, hash, navigate };
}
