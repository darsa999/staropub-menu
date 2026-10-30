import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { normalizePublicSettings } from "../services/api";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = normalizePublicSettings({});

/** Resolves to normalized settings, or null when the request failed. */
async function fetchSettings(forceRefresh) {
  try {
    const url = forceRefresh ? `/api/settings?refresh=true&t=${Date.now()}` : "/api/settings";
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return res.ok ? normalizePublicSettings(await res.json()) : null;
  } catch (err) {
    console.warn("Failed to fetch settings:", err);
    return null;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // Feature-gated UI stays hidden until the first response (or failure) to avoid flicker.
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  const refreshSettings = useCallback(
    (forceRefresh = false) =>
      fetchSettings(forceRefresh).then((next) => {
        if (next) setSettings(next);
        setIsSettingsLoaded(true);
      }),
    []
  );

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const value = useMemo(
    () => ({ settings, isSettingsLoaded, refreshSettings }),
    [settings, isSettingsLoaded, refreshSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
