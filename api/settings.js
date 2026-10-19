import { fetchServerSettings } from "./menu.js";

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    return res.status(204).end();
  }

  let data = null;
  const isRefresh =
    req?.query?.refresh === "true" ||
    req?.headers?.["cache-control"]?.includes("no-cache");

  try {
    data = await fetchServerSettings(isRefresh);
  } catch (err) {
    console.error("[Serverless /api/settings Error]:", err);
    data = {
      isCartEnabled: false,
      cartEnabled: false,
      callWaiterEnabled: false,
      requestBillEnabled: false,
      customMenuEnabled: false,
      reviewFormEnabled: false,
    };
  }

  const isCart =
    typeof data?.isCartEnabled === "boolean"
      ? data.isCartEnabled
      : typeof data?.cartEnabled === "boolean"
        ? data.cartEnabled
        : false;

  const normalized = {
    ...data,
    isCartEnabled: isCart,
    cartEnabled: isCart,
    callWaiterEnabled: typeof data?.callWaiterEnabled === "boolean" ? data.callWaiterEnabled : false,
    requestBillEnabled: typeof data?.requestBillEnabled === "boolean" ? data.requestBillEnabled : false,
    customMenuEnabled: typeof data?.customMenuEnabled === "boolean" ? data.customMenuEnabled : false,
    reviewFormEnabled: typeof data?.reviewFormEnabled === "boolean"
      ? data.reviewFormEnabled
      : typeof data?.isFeedbackEnabled === "boolean"
        ? data.isFeedbackEnabled
        : false,
  };

  const cacheHeader = !isRefresh
    ? "s-maxage=60, stale-while-revalidate=86400"
    : "no-cache, no-store, must-revalidate";

  if (res && typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", cacheHeader);
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (typeof res.status === "function") {
      return res.status(200).json(normalized);
    }
    res.statusCode = 200;
    return res.end(JSON.stringify(normalized));
  }

  return new Response(JSON.stringify(normalized), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheHeader,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
