import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  isCartEnabled: false,
  cartEnabled: false,
  callWaiterEnabled: false,
  requestBillEnabled: false,
  customMenuEnabled: false,
  reviewFormEnabled: false,
  bannerSettings: null,
  unavailableDishIds: [],
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  const refreshSettings = useCallback(async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? `/api/settings?refresh=true&t=${Date.now()}` : `/api/settings`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const isCart =
          typeof data.isCartEnabled === "boolean"
            ? data.isCartEnabled
            : typeof data.cartEnabled === "boolean"
              ? data.cartEnabled
              : false;

        setSettings({
          isCartEnabled: isCart,
          cartEnabled: isCart,
          callWaiterEnabled: typeof data.callWaiterEnabled === "boolean" ? data.callWaiterEnabled : false,
          requestBillEnabled: typeof data.requestBillEnabled === "boolean" ? data.requestBillEnabled : false,
          customMenuEnabled: typeof data.customMenuEnabled === "boolean" ? data.customMenuEnabled : false,
          reviewFormEnabled: typeof data.reviewFormEnabled === "boolean"
            ? data.reviewFormEnabled
            : (typeof data.isFeedbackEnabled === "boolean" ? data.isFeedbackEnabled : false),
          bannerSettings: data.bannerSettings || null,
          unavailableDishIds: Array.isArray(data.unavailableDishIds) ? data.unavailableDishIds : [],
        });
        setIsSettingsLoaded(true);
      }
    } catch (err) {
      console.warn("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
      setIsSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, isSettingsLoaded, refreshSettings }}>
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
