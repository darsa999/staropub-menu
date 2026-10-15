import React, { createContext, useContext, useState, useEffect } from "react";

const ViewModeContext = createContext();

const STORAGE_KEY = "staropub_mobile_view_mode";

export function ViewModeProvider({ children }) {
  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "list" || saved === "grid") {
          return saved;
        }
      } catch {}
    }
    return "grid";
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {}
    }
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
