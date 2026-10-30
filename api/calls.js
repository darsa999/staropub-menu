import { fetchServerMenu } from "./menu.js";
import {
  BACKEND_BASE,
  cleanString,
  clientIp,
  forwardedAuthHeaders,
  rateLimit,
  readBody,
  requestJson,
  sendJson,
  serviceAuthHeaders,
  verifyAdmin,
} from "./_lib/upstream.js";

const SETTINGS_URL = `${BACKEND_BASE}/settings`;
const MAX_CALLS = 50;

const KINDS = {
  waiter: "მიმტანი 💁‍♂️",
  bill: "ანგარიში 🧾",
  order: "შეკვეთა 🛒",
};
const PAYMENT_METHODS = { cash: "ნაღდი ფული", card: "ბარათი" };

async function readCalls() {
  const res = await requestJson(SETTINGS_URL);
  if (!res.ok) return null;
  return Array.isArray(res.data?.waiterCalls) ? res.data.waiterCalls : [];
}

function writeCalls(calls, headers) {
  // NOTE: read-modify-write on the shared settings document. Concurrent writes can
  // still race; an atomic calls collection on the backend is the real fix.
  return requestJson(SETTINGS_URL, {
    method: "PUT",
    headers,
    body: { waiterCalls: calls.slice(0, MAX_CALLS) },
    timeoutMs: 10000,
  });
}

async function resolveOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return null;
  const menu = await fetchServerMenu();
  const byId = new Map();
  for (const cat of menu) for (const p of cat.products) byId.set(p.id, p);

  const items = [];
  for (const raw of rawItems.slice(0, 50)) {
    const product = byId.get(String(raw?.id || ""));
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(raw?.quantity) || 0)));
    if (!product || !product.available) continue;
    items.push({ id: product.id, name: product.name.ka, quantity, price: product.price });
  }
  return items.length ? items : null;
}

export default async function handler(req, res) {
  const noStore = { "Cache-Control": "no-store" };

  if (req.method === "POST") {
    if (!rateLimit(`calls:${clientIp(req)}`, 10, 60 * 1000)) {
      return sendJson(res, 429, { ok: false, error: "too_many_requests" }, noStore);
    }

    const body = readBody(req);
    const table = cleanString(body.table, 10);
    const kind = Object.hasOwn(KINDS, body.kind) ? body.kind : "waiter";
    if (!table) return sendJson(res, 400, { ok: false, error: "table_required" }, noStore);

    const newCall = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      table,
      type: KINDS[kind],
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString("ka-GE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Tbilisi",
      }),
    };

    if (kind === "bill") {
      const method = PAYMENT_METHODS[body.paymentMethod];
      if (method) {
        newCall.paymentMethod = body.paymentMethod;
        newCall.type = `${KINDS.bill} (${method})`;
      }
    }

    if (kind === "order") {
      const items = await resolveOrderItems(body.items);
      if (!items) return sendJson(res, 400, { ok: false, error: "empty_order" }, noStore);
      newCall.items = items;
      newCall.total = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
    }

    const existing = await readCalls();
    if (existing === null) return sendJson(res, 502, { ok: false, error: "upstream_unavailable" }, noStore);

    const saved = await writeCalls([newCall, ...existing], serviceAuthHeaders());
    if (!saved.ok) {
      console.error("[/api/calls] upstream write failed with status", saved.status);
      return sendJson(res, 502, { ok: false, error: "upstream_write_failed" }, noStore);
    }
    return sendJson(res, 201, { ok: true, call: newCall }, noStore);
  }

  if (req.method === "GET" || req.method === "DELETE") {
    if (!(await verifyAdmin(req))) return sendJson(res, 401, { error: "unauthorized" }, noStore);

    const calls = await readCalls();
    if (calls === null) return sendJson(res, 502, { error: "upstream_unavailable" }, noStore);
    if (req.method === "GET") return sendJson(res, 200, { calls }, noStore);

    // DELETE ?id=<id> removes one call, DELETE without id clears all.
    const id = req.query?.id ? String(req.query.id) : null;
    const remaining = id ? calls.filter((c) => String(c.id) !== id) : [];
    const saved = await writeCalls(remaining, forwardedAuthHeaders(req));
    if (!saved.ok) return sendJson(res, saved.status || 502, { error: "upstream_write_failed" }, noStore);
    return sendJson(res, 200, { calls: remaining }, noStore);
  }

  return sendJson(res, 405, { error: "Method not allowed" }, { ...noStore, Allow: "GET, POST, DELETE" });
}
