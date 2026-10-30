import React from "react";

/** Red notice shown when admin data could not be loaded (instead of an empty list). */
export default function LoadErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div role="alert" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171", borderRadius: 10, padding: "10px 14px", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
      ⚠️ {message}
    </div>
  );
}
