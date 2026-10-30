import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mockRes() {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.end = (body) => { res.body = body ? JSON.parse(body) : undefined; };
  return res;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

let upstream;

beforeEach(() => {
  vi.resetModules();
  upstream = { settings: { isCartEnabled: true, waiterCalls: [], reviews: [{ name: "a" }] }, puts: [], putStatus: 200, meStatus: 401, persist: true };
  vi.stubGlobal("fetch", vi.fn(async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/auth/me")) return jsonResponse({}, upstream.meStatus);
    if (path.endsWith("/categories")) return jsonResponse([{ id: "beer" }]);
    if (path.endsWith("/dishes")) return jsonResponse([{ id: "d1", category: "beer", name_ka: "ლუდი", price: 7 }]);
    if (path.endsWith("/settings")) {
      if (init.method === "PUT") {
        const patch = JSON.parse(init.body);
        upstream.puts.push(patch);
        if (upstream.persist && upstream.putStatus < 300) Object.assign(upstream.settings, patch);
        return jsonResponse({ ok: upstream.putStatus < 300 }, upstream.putStatus);
      }
      return jsonResponse(upstream.settings);
    }
    return jsonResponse({}, 404);
  }));
});

afterEach(() => vi.unstubAllGlobals());

const post = (body, ip = "1.1.1.1") => ({ method: "POST", body, query: {}, headers: { "x-forwarded-for": ip } });

describe("/api/settings", () => {
  it("only exposes public feature flags", async () => {
    const { default: handler } = await import("../api/settings.js");
    const res = mockRes();
    await handler({ method: "GET", query: {}, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.isCartEnabled).toBe(true);
    expect(res.body).not.toHaveProperty("reviews");
    expect(res.body).not.toHaveProperty("waiterCalls");
  });

  it("proxies PUT upstream with the caller's credentials and status", async () => {
    upstream.putStatus = 401;
    const { default: handler } = await import("../api/settings.js");
    const res = mockRes();
    await handler({ method: "PUT", body: { isCartEnabled: false }, query: {}, headers: { authorization: "Bearer t" } }, res);
    expect(res.statusCode).toBe(401);
    const putCall = fetch.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(putCall[1].headers.Authorization).toBe("Bearer t");
  });
});

describe("/api/calls", () => {
  it("stores a validated waiter call", async () => {
    const { default: handler } = await import("../api/calls.js");
    const res = mockRes();
    await handler(post({ kind: "waiter", table: " 5 " }), res);
    expect(res.statusCode).toBe(201);
    expect(upstream.puts[0].waiterCalls[0]).toMatchObject({ kind: "waiter", table: "5" });
  });

  it("rejects a missing table", async () => {
    const { default: handler } = await import("../api/calls.js");
    const res = mockRes();
    await handler(post({ kind: "waiter" }), res);
    expect(res.statusCode).toBe(400);
  });

  it("reports upstream write failures instead of faking success", async () => {
    upstream.putStatus = 500;
    const { default: handler } = await import("../api/calls.js");
    const res = mockRes();
    await handler(post({ kind: "bill", table: "2", paymentMethod: "cash" }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body.ok).toBe(false);
  });

  it("detects a backend that accepts the write but drops the field", async () => {
    upstream.persist = false;
    const { default: handler } = await import("../api/calls.js");
    const res = mockRes();
    await handler(post({ kind: "waiter", table: "4" }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe("upstream_did_not_persist");
  });

  it("prices orders from the server-side menu, ignoring client prices", async () => {
    const { default: handler } = await import("../api/calls.js");
    const res = mockRes();
    await handler(post({ kind: "order", table: "3", items: [{ id: "d1", quantity: 2, price: 0.01 }, { id: "nope", quantity: 1 }] }), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.call.items).toEqual([{ id: "d1", name: "ლუდი", quantity: 2, price: 7 }]);
    expect(res.body.call.total).toBe(14);
  });

  it("rate-limits a single client", async () => {
    const { default: handler } = await import("../api/calls.js");
    let res;
    for (let i = 0; i < 11; i++) {
      res = mockRes();
      await handler(post({ kind: "waiter", table: "1" }, "9.9.9.9"), res);
    }
    expect(res.statusCode).toBe(429);
  });

  it("requires an admin to list calls", async () => {
    const { default: handler } = await import("../api/calls.js");
    const res = mockRes();
    await handler({ method: "GET", query: {}, headers: {} }, res);
    expect(res.statusCode).toBe(401);

    upstream.meStatus = 200;
    const ok = mockRes();
    await handler({ method: "GET", query: {}, headers: { authorization: "Bearer t" } }, ok);
    expect(ok.statusCode).toBe(200);
    expect(ok.body.stored).toBe(true);
  });

  it("tells the admin when the backend has never stored calls", async () => {
    upstream.meStatus = 200;
    delete upstream.settings.waiterCalls;
    const { default: handler } = await import("../api/calls.js");
    const res = mockRes();
    await handler({ method: "GET", query: {}, headers: { authorization: "Bearer t" } }, res);
    expect(res.body).toEqual({ calls: [], stored: false });
  });
});

describe("/api/reviews", () => {
  it("detects a backend that accepts the write but drops the field", async () => {
    upstream.persist = false;
    const { default: handler } = await import("../api/reviews.js");
    const res = mockRes();
    await handler(post({ rating: 4, comment: "ok" }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe("upstream_did_not_persist");
  });

  it("clamps and trims input", async () => {
    const { default: handler } = await import("../api/reviews.js");
    const res = mockRes();
    await handler(post({ rating: 99, name: "x".repeat(200), comment: " hi " }), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.review).toMatchObject({ rating: 5, comment: "hi" });
    expect(res.body.review.name).toHaveLength(60);
  });
});
