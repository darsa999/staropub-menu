// Step-by-step auth tracing (login → session → role check → redirect).
// Off by default; enable in the browser console with:
//   localStorage.setItem("staropub_debug_auth", "1")
function isEnabled() {
  try {
    return localStorage.getItem("staropub_debug_auth") === "1";
  } catch {
    return false;
  }
}

export function authLog(...args) {
  if (isEnabled()) console.log("[auth]", ...args);
}
