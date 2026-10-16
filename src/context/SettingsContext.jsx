import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  isCartEnabled: true,
  callWaiterEnabled: true,
  requestBillEnabled: true,
  customMenuEnabled: true,
  reviewFormEnabled: true,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
          isCartEnabled: typeof data.isCartEnabled === "boolean" ? data.isCartEnabled : true,
          callWaiterEnabled: typeof data.callWaiterEnabled === "boolean" ? data.callWaiterEnabled : true,
          requestBillEnabled: typeof data.requestBillEnabled === "boolean" ? data.requestBillEnabled : true,
          customMenuEnabled: typeof data.customMenuEnabled === "boolean" ? data.customMenuEnabled : true,
          reviewFormEnabled: typeof data.reviewFormEnabled === "boolean"
            ? data.reviewFormEnabled
            : (typeof data.isFeedbackEnabled === "boolean" ? data.isFeedbackEnabled : true),
        });
      }
    } catch (err) {
      console.warn("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
