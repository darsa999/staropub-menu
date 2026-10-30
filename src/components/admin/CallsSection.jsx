import React, { useState } from "react";
import { clearWaiterCalls, deleteWaiterCall } from "../../services/adminApi";
import LoadErrorBanner from "./LoadErrorBanner";

const KIND_LABELS = {
  waiter: "მიმტანი 💁‍♂️",
  bill: "ანგარიში 🧾",
  order: "შეკვეთა 🛒",
};

function callLabel(call) {
  if (call.kind === "bill" && call.type) return call.type;
  if (KIND_LABELS[call.kind]) return KIND_LABELS[call.kind];
  // Calls stored before `kind` existed only have a free-text type.
  if (/bill|ანგარიში/i.test(call.type || "")) return call.type;
  return call.type || KIND_LABELS.waiter;
}

const buttonStyle = {
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

export default function CallsSection({ calls, setCalls, loadError, onError }) {
  const [busyId, setBusyId] = useState(null);

  const run = async (id, action) => {
    setBusyId(id);
    try {
      setCalls(await action());
    } catch (err) {
      onError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleClearAll = () => {
    if (calls.length === 0 || !window.confirm("ნამდვილად გსურთ ყველა გამოძახების წაშლა?")) return;
    run("all", clearWaiterCalls);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontFamily: "'Georgia', serif" }}>მიმტანისა და ანგარიშის გამოძახება</h3>
        <span style={{ fontSize: 11, color: "#8a6040" }}>ახლდება ავტომატურად ყოველ 15 წამში</span>
        <button
          onClick={handleClearAll}
          disabled={busyId !== null || calls.length === 0}
          style={{ ...buttonStyle, background: "rgba(180,40,40,0.1)", border: "1px solid rgba(180,40,40,0.25)", color: "#e06060", marginLeft: "auto", opacity: calls.length === 0 ? 0.5 : 1 }}
        >
          ყველას წაშლა
        </button>
      </div>

      <LoadErrorBanner message={loadError} />

      {calls.length === 0 ? (
        !loadError && <p style={{ color: "#8a6040", textAlign: "center", margin: "40px 0" }}>მაგიდებიდან აქტიური გამოძახება არ არის.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {calls.map((call) => (
            <div key={call.id} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: "bold" }}>მაგიდა {call.table}</span>
                  <span style={{ background: "rgba(184,101,32,0.15)", color: "#e8a030", fontSize: 11, padding: "2px 8px", borderRadius: 10, marginLeft: 10 }}>
                    {callLabel(call)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "#8a6040" }}>{call.time}</span>
                  <button
                    onClick={() => run(call.id, () => deleteWaiterCall(call.id))}
                    disabled={busyId !== null}
                    style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
                  >
                    {busyId === call.id ? "..." : "დასრულება"}
                  </button>
                </div>
              </div>

              {Array.isArray(call.items) && call.items.length > 0 && (
                <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", fontSize: 12, color: "#cbd5e1" }}>
                  {call.items.map((item) => (
                    <li key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                      <span>{item.quantity} × {item.name}</span>
                      <span>{(item.price * item.quantity).toFixed(2)} ₾</span>
                    </li>
                  ))}
                  <li style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, marginTop: 4, borderTop: "1px solid rgba(180,120,40,0.15)", fontWeight: "bold", color: "#f0c060" }}>
                    <span>სულ</span>
                    <span>{Number(call.total || 0).toFixed(2)} ₾</span>
                  </li>
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
