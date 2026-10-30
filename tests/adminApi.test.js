import { afterEach, describe, expect, it, vi } from "vitest";

async function loadWithApiUrl(value) {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", value);
  return import("../src/services/adminApi.js");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("admin auth endpoint", () => {
  it.each([
    ["", "/api/auth/login"],
    ["https://staropub-menu.onrender.com", "https://staropub-menu.onrender.com/api/auth/login"],
    ["https://staropub-menu.onrender.com/", "https://staropub-menu.onrender.com/api/auth/login"],
    ["https://staropub-menu.onrender.com/api", "https://staropub-menu.onrender.com/api/auth/login"],
    ["https://staropub-menu.onrender.com/api/", "https://staropub-menu.onrender.com/api/auth/login"],
  ])("VITE_API_URL=%j posts to %s", async (envValue, expectedUrl) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ token: "t" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });
    vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });

    const { loginAdmin } = await loadWithApiUrl(envValue);
    await loginAdmin({ email: "a@b.c", password: "pw" });

    expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl);
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("sends the Firebase ID token to the backend social-login endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ token: "t" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });
    vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });
    const { socialLoginAdmin } = await loadWithApiUrl("https://staropub-menu.onrender.com");
    await socialLoginAdmin("firebase-id-token");
    expect(fetchMock.mock.calls[0][0]).toBe("https://staropub-menu.onrender.com/api/auth/social-login");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ token: "firebase-id-token" });
  });

  it("shows a Georgian message instead of HTTP 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>Not Found</html>", { status: 404 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { registerAdmin } = await loadWithApiUrl("");
    await expect(registerAdmin({ email: "a@b.c", password: "pw" })).rejects.toThrow("სერვერთან დაკავშირება ვერ მოხერხდა");
  });

  it("keeps the backend's own message for wrong credentials", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "არასწორი პაროლი" }), { status: 401 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { loginAdmin } = await loadWithApiUrl("");
    await expect(loginAdmin({ email: "a@b.c", password: "x" })).rejects.toThrow("არასწორი პაროლი");
  });

  it("reports network failures as a connection error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { loginAdmin } = await loadWithApiUrl("");
    await expect(loginAdmin({ email: "a@b.c", password: "x" })).rejects.toThrow("სერვერთან დაკავშირება ვერ მოხერხდა");
  });
});
