const TABLE_KEY = "staropub_table";

/** Table number from the QR-code URL (?table=5) or the last one the guest entered. */
export function getStoredTable() {
  try {
    return new URLSearchParams(window.location.search).get("table") || localStorage.getItem(TABLE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveTable(table) {
  try {
    if (table) localStorage.setItem(TABLE_KEY, table);
  } catch {}
}
