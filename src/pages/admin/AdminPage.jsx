import React, { useState, useEffect, useCallback } from "react";
import OriginalAdminDashboard from "../../components/admin/OriginalAdminDashboard";
import { auth, googleProvider, signInWithPopup } from "../../admin/firebase";

const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const API_URL = RAW_API_URL ? RAW_API_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "") : "";

const INITIAL_CATEGORY_LABELS = {};
const INITIAL_CATEGORY_ICONS = {};
const INITIAL_HOT_CATEGORIES = new Set();

export default function AdminPage({ onBackToSite }) {
  const [lang] = useState("ka");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Auth modal states
  const [authModalOpen, setAuthModalOpen] = useState(true);
  const [authTab, setAuthTab] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRememberMe, setAuthRememberMe] = useState(true);
  const [authError, setAuthError] = useState("");

  // Data states from server
  const [allItems, setAllItems] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [dishOrder, setDishOrder] = useState([]);
  const [categoryLabels, setCategoryLabels] = useState(INITIAL_CATEGORY_LABELS);
  const [categoryIcons, setCategoryIcons] = useState(INITIAL_CATEGORY_ICONS);
  const [hotCategories, setHotCategories] = useState(INITIAL_HOT_CATEGORIES);
  const [unavailableDishIds, setUnavailableDishIds] = useState([]);

  // Waiter & Settings states
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [bannerSettings, setBannerSettings] = useState({
    enabled: false,
    text: "",
    image: "",
    badge: "",
  });
  const [reviews, setReviews] = useState([]);
  const [customMenuEnabled, setCustomMenuEnabled] = useState(true);
  const [callWaiterEnabled, setCallWaiterEnabled] = useState(true);
  const [requestBillEnabled, setRequestBillEnabled] = useState(true);
  const [isCartEnabled, setIsCartEnabled] = useState(true);
  const [reviewFormEnabled, setReviewFormEnabled] = useState(true);

  const refreshMenuData = useCallback(async () => {
    try {
      const token = typeof localStorage !== "undefined" ? (localStorage.getItem("staropub_admin_token") || "") : "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [catRes, settingsRes, dishRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/categories`, { headers, credentials: "include" }),
        fetch(`${API_URL}/api/settings`, { headers, credentials: "include" }),
        fetch(`${API_URL}/api/dishes`, { headers, credentials: "include" })
      ]);

      if (catRes.status === "fulfilled" && catRes.value.ok) {
        const categoriesData = await catRes.value.json();
        const labels = {};
        const icons = {};
        const hot = new Set();
        categoriesData.forEach(cat => {
          const key = cat.id || cat._id;
          labels[key] = {
            ka: cat.name_ka || key,
            en: cat.name_en || key,
            ru: cat.name_ru || key,
          };
          icons[key] = cat.icon || "🍽️";
          if (cat.isHot) hot.add(key);
        });

        setCategoryLabels(labels);
        setCategoryIcons(icons);
        setHotCategories(hot);
        setDbCategories(categoriesData);
        setCategoryOrder(categoriesData.map(cat => cat.id || cat._id));
      }

      if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
        const settingsMap = await settingsRes.value.json();
        if (typeof settingsMap.callWaiterEnabled === "boolean") setCallWaiterEnabled(settingsMap.callWaiterEnabled);
        if (typeof settingsMap.requestBillEnabled === "boolean") setRequestBillEnabled(settingsMap.requestBillEnabled);
        if (typeof settingsMap.isCartEnabled === "boolean") setIsCartEnabled(settingsMap.isCartEnabled);
        if (typeof settingsMap.reviewFormEnabled === "boolean") {
          setReviewFormEnabled(settingsMap.reviewFormEnabled);
        } else if (typeof settingsMap.isFeedbackEnabled === "boolean") {
          setReviewFormEnabled(settingsMap.isFeedbackEnabled);
        }
        if (settingsMap.bannerSettings) setBannerSettings(settingsMap.bannerSettings);
        if (typeof settingsMap.customMenuEnabled === "boolean") setCustomMenuEnabled(settingsMap.customMenuEnabled);
        if (Array.isArray(settingsMap.unavailableDishIds)) setUnavailableDishIds(settingsMap.unavailableDishIds);
      }

      if (dishRes.status === "fulfilled" && dishRes.value.ok) {
        const dishesData = await dishRes.value.json();
        const formattedDishes = dishesData.map(dish => ({
          ...dish,
          id: dish.id || dish._id,
        }));
        setAllItems(formattedDishes);
        setDishOrder(formattedDishes.map(d => d.id));
      }
    } catch (err) {
      console.error("Failed to refresh admin menu data:", err);
    }
  }, []);

  // Check auth session on mount
  useEffect(() => {
    let isMounted = true;
    const checkAuthSession = async () => {
      try {
        const token = typeof localStorage !== "undefined" ? (localStorage.getItem("staropub_admin_token") || "") : "";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers,
          credentials: "include"
        });

        if (!isMounted) return;
        if (meRes.ok) {
          setIsAdmin(true);
          setIsAuthenticated(true);
          setAuthModalOpen(false);
          await refreshMenuData();
        } else {
          setIsAdmin(false);
          setIsAuthenticated(false);
          setAuthModalOpen(true);
        }
      } catch (meErr) {
        console.warn("Session validation failed:", meErr);
        if (isMounted) {
          setIsAdmin(false);
          setIsAuthenticated(false);
          setAuthModalOpen(true);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    refreshMenuData();
    checkAuthSession();
    return () => {
      isMounted = false;
    };
  }, [refreshMenuData]);

  // Auth Submit Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const url = authTab === "login"
      ? `${API_URL}/api/auth/login`
      : `${API_URL}/api/auth/register`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
          rememberMe: authRememberMe
        }),
        credentials: "include"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ავტორიზაცია ვერ მოხერხდა");
      }
      if (data.token) {
        localStorage.setItem("staropub_admin_token", data.token);
      }
      setIsAdmin(true);
      setIsAuthenticated(true);
      setAuthModalOpen(false);
      setAuthEmail("");
      setAuthPassword("");
      await refreshMenuData();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Google Social Login Handler
  const handleSocialLogin = async (providerName) => {
    setAuthError("");
    try {
      let provider;
      if (providerName === "google") {
        provider = googleProvider;
      } else {
        throw new Error("Unsupported provider");
      }

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_URL}/api/auth/social-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
        credentials: "include"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "სოციალური ავტორიზაცია ვერ მოხერხდა");
      }
      if (data.token) {
        localStorage.setItem("staropub_admin_token", data.token);
      }
      setIsAdmin(true);
      setIsAuthenticated(true);
      setAuthModalOpen(false);
      await refreshMenuData();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("staropub_admin_token");
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    setIsAdmin(false);
    setIsAuthenticated(false);
    setAuthModalOpen(true);
  };

  if (isCheckingSession) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1d", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0c060", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid rgba(240,192,96,0.2)", borderTopColor: "#f0c060", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <span style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>ავტორიზაციის შემოწმება...</span>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1d", width: "100%" }}>
      {/* ── ADMIN AUTH MODAL FORM ── */}
      {authModalOpen && !isAuthenticated && (
        <div
          onClick={onBackToSite}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 24,
              padding: "28px 24px",
              boxShadow: "0 30px 70px rgba(0,0,0,0.6)"
            }}
          >
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "rgba(0,0,0,0.3)", padding: 4, borderRadius: 12 }}>
              <button
                onClick={() => { setAuthTab("login"); setAuthError(""); }}
                style={{
                  flex: 1,
                  background: authTab === "login" ? "linear-gradient(135deg, #b86520, #7a3a08)" : "none",
                  border: "none",
                  color: authTab === "login" ? "#fff" : "#94a3b8",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: "bold",
                  transition: "all 0.2s"
                }}
              >
                შესვლა
              </button>
              <button
                onClick={() => { setAuthTab("register"); setAuthError(""); }}
                style={{
                  flex: 1,
                  background: authTab === "register" ? "linear-gradient(135deg, #b86520, #7a3a08)" : "none",
                  border: "none",
                  color: authTab === "register" ? "#fff" : "#94a3b8",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: "bold",
                  transition: "all 0.2s"
                }}
              >
                რეგისტრაცია
              </button>
            </div>

            <h3 style={{ margin: "0 0 8px", color: "#f0c060", fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, textAlign: "center" }}>
              {authTab === "login" ? "ადმინისტრატორის ავტორიზაცია" : "ადმინისტრატორის რეგისტრაცია"}
            </h3>

            {authError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 10, padding: 10, color: "#f87171", fontSize: 12, marginBottom: 16, textAlign: "center" }}>
                ⚠️ {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase", fontWeight: "bold" }}>ელ-ფოსტა</label>
                <input
                  type="email"
                  required
                  placeholder="admin@staropub.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  style={{ background: "#0f172a", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: 12, color: "#f8fafc", outline: "none", fontSize: 13 }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase", fontWeight: "bold" }}>პაროლი</label>
                <input
                  type="password"
                  required
                  placeholder="******"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  style={{ background: "#0f172a", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: 12, color: "#f8fafc", outline: "none", fontSize: 13 }}
                />
              </div>

              {authTab === "login" && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#cbd5e1", margin: "4px 0" }}>
                  <input
                    type="checkbox"
                    checked={authRememberMe}
                    onChange={e => setAuthRememberMe(e.target.checked)}
                    style={{ accentColor: "#e8a030", width: 15, height: 15 }}
                  />
                  დამიმახსოვრე (30 დღე)
                </label>
              )}

              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, #b86520, #7a3a08)",
                  border: "1px solid #f0c060",
                  borderRadius: 12,
                  color: "#fff",
                  padding: "12px 16px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(184,101,32,0.3)"
                }}
              >
                {authTab === "login" ? "შესვლა" : "რეგისტრაცია"}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>ან</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Social Logins */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: "#0f172a",
                  border: "1px solid rgba(220,38,38,0.25)",
                  color: "#cbd5e1",
                  padding: "10px 16px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ color: "#ea4335", fontSize: 16 }}>🔴</span> Google-ით შესვლა
              </button>
            </div>

            <button
              type="button"
              onClick={onBackToSite}
              style={{
                background: "none",
                border: "none",
                color: "#8a6040",
                display: "block",
                margin: "20px auto 0",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              საიტზე / მენიუზე დაბრუნება
            </button>
          </div>
        </div>
      )}

      {/* ── ADMIN DASHBOARD ── */}
      {isAdmin && (
        <OriginalAdminDashboard
          lang={lang}
          onClose={onBackToSite}
          onLogout={handleLogout}
          onSaveSuccess={refreshMenuData}
          waiterCalls={waiterCalls}
          setWaiterCalls={setWaiterCalls}
          bannerSettings={bannerSettings}
          setBannerSettings={setBannerSettings}
          customMenuEnabled={customMenuEnabled}
          setCustomMenuEnabled={setCustomMenuEnabled}
          callWaiterEnabled={callWaiterEnabled}
          setCallWaiterEnabled={setCallWaiterEnabled}
          requestBillEnabled={requestBillEnabled}
          setRequestBillEnabled={setRequestBillEnabled}
          isCartEnabled={isCartEnabled}
          setIsCartEnabled={setIsCartEnabled}
          reviewFormEnabled={reviewFormEnabled}
          setReviewFormEnabled={setReviewFormEnabled}
          reviews={reviews}
          setReviews={setReviews}
          unavailableDishIds={unavailableDishIds}
          setUnavailableDishIds={setUnavailableDishIds}
          allItems={allItems}
          setAllItems={setAllItems}
          categoryOrder={categoryOrder}
          setCategoryOrder={setCategoryOrder}
          dishOrder={dishOrder}
          setDishOrder={setDishOrder}
          categoryLabels={categoryLabels}
          setCategoryLabels={setCategoryLabels}
          categoryIcons={categoryIcons}
          setCategoryIcons={setCategoryIcons}
          hotCategories={hotCategories}
          setHotCategories={setHotCategories}
          dbCategories={dbCategories}
          setDbCategories={setDbCategories}
        />
      )}
    </div>
  );
}
