import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

const ViewModeContext = createContext(null);

const STORAGE_KEY = "staropub_mobile_view_mode";

function getInitialViewMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "list" || saved === "grid") return saved;
  } catch {}
  return "grid";
}

export function ViewModeProvider({ children }) {
  const [viewMode, setViewModeState] = useState(getInitialViewMode);

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, []);

  const value = useMemo(() => ({ viewMode, setViewMode }), [viewMode, setViewMode]);

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
