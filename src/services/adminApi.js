import { API_BASE_URL } from "./api";
import { authLog } from "./authDebug";

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

const CONNECTION_ERROR = "სერვერთან დაკავშირება ვერ მოხერხდა. შეამოწმეთ ინტერნეტი და სცადეთ თავიდან.";

/** Turns an HTTP failure into a message an admin can act on (details go to the console). */
function friendlyHttpError(status, data) {
  const serverMessage = typeof data?.error === "string" ? data.error : typeof data?.message === "string" ? data.message : "";
  if (status === 404 || status === 405) return "სერვერთან დაკავშირება ვერ მოხერხდა (სერვისი ვერ მოიძებნა).";
  if (status >= 500 && serverMessage !== "auth_backend_unavailable") return serverMessage && !/^[a-z_]+$/.test(serverMessage)
    ? serverMessage
    : "სერვერი დროებით მიუწვდომელია. სცადეთ რამდენიმე წამში.";
  if (status === 429) return "ძალიან ბევრი მცდელობა. სცადეთ ცოტა ხანში.";
  if (serverMessage === "auth_backend_unavailable") return "ავტორიზაციის სერვერი (Render) ჯერ არ პასუხობს. სცადეთ რამდენიმე წამში.";
  if (serverMessage === "admin_unverified") return "ადმინის სესია ვერ დადასტურდა ამ სერვისისთვის.";
  if (serverMessage === "not_admin") return "ამ ანგარიშს ადმინისტრატორის უფლება არ აქვს.";
  // 400/401/403/409 from the backend carry a meaningful message (e.g. wrong password).
  return serverMessage || `მოთხოვნა ვერ შესრულდა (კოდი ${status}).`;
}

/**
 * Authenticated JSON request that throws on any non-2xx response.
 * Bodies that are FormData are sent as-is; everything else is JSON-encoded.
 */
export async function request(path, { method = "GET", body, signal, handleUnauthorized = true } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res;
  try {
    res = await authFetch(path, {
      method,
      signal,
      headers: body !== undefined && !isForm ? { "Content-Type": "application/json" } : {},
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[adminApi] ${method} ${path} network error:`, err);
    const error = new Error(CONNECTION_ERROR);
    error.status = 0;
    throw error;
  }

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (res.status === 401 && handleUnauthorized) {
    clearAdminToken();
    if (onUnauthorized) onUnauthorized();
    throw new AuthError();
  }
  if (!res.ok) {
    console.error(`[adminApi] ${method} ${res.url || path} → HTTP ${res.status}`, raw.slice(0, 500));
    const error = new Error(friendlyHttpError(res.status, data));
    error.status = res.status;
    throw error;
  }
  return data;
}

// ─── Authentication ────────────────────────────────────────────────────────

async function authenticate(path, payload, remember) {
  authLog(`POST ${API_BASE_URL}${path}`);
  const data = await request(path, { method: "POST", body: payload, handleUnauthorized: false });
  if (data.token) {
    setAdminToken(data.token, remember);
    authLog("login ok, token stored in", remember ? "localStorage" : "sessionStorage");
  } else {
    // Without a token the session lives only in the backend's cookie.
    authLog("login ok, but the backend returned no token (cookie-only session)");
  }
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

/**
 * Asks the backend who is logged in.
 * @returns {Promise<{ state: "ok", user: object } | { state: "unauthenticated" | "forbidden" | "unavailable", status?: number }>}
 *   Only "unauthenticated" clears the stored token; a cold or unreachable backend
 *   must not log the admin out.
 */
export async function checkAdminSession() {
  authLog("checking session", getAdminToken() ? "(token present)" : "(no token, relying on cookie)");
  let res;
  try {
    res = await authFetch("/auth/me", { signal: AbortSignal.timeout(40000) });
  } catch (err) {
    console.error("[adminApi] GET /auth/me failed:", err);
    return { state: "unavailable", status: 0 };
  }

  authLog("/auth/me →", res.status);
  if (res.ok) return { state: "ok", user: await res.json().catch(() => ({})) };
  if (res.status === 401) {
    clearAdminToken();
    return { state: "unauthenticated", status: 401 };
  }
  if (res.status === 403) {
    clearAdminToken();
    return { state: "forbidden", status: 403 };
  }
  console.error(`[adminApi] GET /auth/me → HTTP ${res.status}`);
  return { state: "unavailable", status: res.status };
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
    if (!Array.isArray(data?.[key])) {
      const error = new Error("სერვერთან დაკავშირება ვერ მოხერხდა (სერვისი ვერ მოიძებნა).");
      error.status = 404;
      throw error;
    }
    return data[key];
  };
}

/** Resolves to `{ items, stored }`; `stored: false` means the backend has never kept one. */
// These go through Vercel functions that verify the admin with the backend themselves;
// a failure there (cold backend, cookie-only session) is shown in the section and must
// not log the admin out of the panel.
const sideRequest = (path, options = {}) => request(path, { ...options, handleUnauthorized: false });

export const fetchWaiterCalls = () =>
  sideRequest("/api/calls").then((d) => ({ items: expectArray("calls")(d), stored: d.stored !== false }));
export const deleteWaiterCall = (id) => sideRequest(`/api/calls?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then(expectArray("calls"));
export const clearWaiterCalls = () => sideRequest("/api/calls", { method: "DELETE" }).then(expectArray("calls"));
export const fetchReviews = () =>
  sideRequest("/api/reviews").then((d) => ({ items: expectArray("reviews")(d), stored: d.stored !== false }));
