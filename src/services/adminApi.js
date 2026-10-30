import { API_BASE_URL } from "./api";

const TOKEN_KEY = "staropub_admin_token";

export class AuthError extends Error {
  constructor(message = "სესია ამოიწურა, გთხოვთ თავიდან შეხვიდეთ") {
    super(message);
    this.name = "AuthError";
  }
}

export function getAdminToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setAdminToken(token, remember = true) {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAdminToken() {
  setAdminToken("");
}

export function getAuthHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let onUnauthorized = null;

/** Registers a callback that runs whenever an authenticated request returns 401. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

/**
 * Low-level authenticated fetch. Resolves with the raw Response.
 * `path` is either absolute (http…), same-origin (/api/calls) or relative to API_BASE_URL.
 */
export function authFetch(path, options = {}) {
  const url = /^https?:\/\//.test(path) || path.startsWith("/api/") ? path : `${API_BASE_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
    credentials: "include",
  });
}

/**
 * Authenticated JSON request that throws on any non-2xx response.
 * Bodies that are FormData are sent as-is; everything else is JSON-encoded.
 */
export async function request(path, { method = "GET", body, signal, handleUnauthorized = true } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await authFetch(path, {
    method,
    signal,
    headers: body !== undefined && !isForm ? { "Content-Type": "application/json" } : {},
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && handleUnauthorized) {
    clearAdminToken();
    if (onUnauthorized) onUnauthorized();
    throw new AuthError();
  }
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

// ─── Authentication ────────────────────────────────────────────────────────

async function authenticate(path, payload, remember) {
  const data = await request(path, { method: "POST", body: payload, handleUnauthorized: false });
  if (data.token) setAdminToken(data.token, remember);
  return data;
}

export function loginAdmin({ email, password, rememberMe = true }) {
  return authenticate("/auth/login", { email: email.trim(), password, rememberMe }, rememberMe);
}

export function registerAdmin({ email, password }) {
  return authenticate("/auth/register", { email: email.trim(), password }, true);
}

export function socialLoginAdmin(idToken) {
  return authenticate("/auth/social-login", { token: idToken }, true);
}

export async function checkAdminSession() {
  const res = await authFetch("/auth/me");
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) clearAdminToken();
    return null;
  }
  return res.json().catch(() => ({}));
}

export async function logoutAdmin() {
  clearAdminToken();
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } catch {}
}

// ─── Data ──────────────────────────────────────────────────────────────────

export const fetchAdminCategories = () => request("/categories");
export const fetchAdminDishes = () => request("/dishes");
// refresh=true bypasses the edge cache on the same-origin function (ignored by Render).
export const fetchAdminSettings = () => request(`/settings?refresh=true&t=${Date.now()}`);
export const updateAdminSettings = (settings) => request("/settings", { method: "PUT", body: settings });

export const createCategory = (body) => request("/categories", { method: "POST", body });
export const updateCategory = (id, body) => request(`/categories/${encodeURIComponent(id)}`, { method: "PUT", body });
export const deleteCategory = (id) => request(`/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
export const reorderCategories = (ids) => request("/categories/reorder", { method: "PUT", body: { ids, order: ids } });

export const createDish = (body) => request("/dishes", { method: "POST", body });
export const updateDish = (id, body) => request(`/dishes/${encodeURIComponent(id)}`, { method: "PUT", body });
export const patchDish = (id, body) => request(`/dishes/${encodeURIComponent(id)}`, { method: "PATCH", body });
export const deleteDish = (id) => request(`/dishes/${encodeURIComponent(id)}`, { method: "DELETE" });
export const reorderDishes = (ids) => request("/dishes/reorder", { method: "PUT", body: { ids, order: ids } });

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const data = await request("/upload", { method: "POST", body: formData });
  return data.url;
}

// Waiter calls and reviews live in same-origin Vercel functions, not on Render.
// A host without these functions (e.g. a static SPA fallback) answers 200 with HTML,
// so the expected array is required rather than defaulting to an empty list.
function expectArray(key) {
  return (data) => {
    if (!Array.isArray(data?.[key])) throw new Error("HTTP 404");
    return data[key];
  };
}

/** Resolves to `{ items, stored }`; `stored: false` means the backend has never kept one. */
export const fetchWaiterCalls = () =>
  request("/api/calls").then((d) => ({ items: expectArray("calls")(d), stored: d.stored !== false }));
export const deleteWaiterCall = (id) => request(`/api/calls?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then(expectArray("calls"));
export const clearWaiterCalls = () => request("/api/calls", { method: "DELETE" }).then(expectArray("calls"));
export const fetchReviews = () =>
  request("/api/reviews").then((d) => ({ items: expectArray("reviews")(d), stored: d.stored !== false }));
