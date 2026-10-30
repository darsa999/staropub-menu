import React from "react";

export default function ReviewsSection({ reviews }) {
  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>სტუმრების შეფასებების ჟურნალი</h3>
      {reviews.length === 0 ? (
        <p style={{ color: "#8a6040", textAlign: "center", margin: "40px 0" }}>სტუმრების შეფასებები ჯერ არ არის შემოსული.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reviews.map((rev) => {
            const rating = Math.min(5, Math.max(0, Math.round(Number(rev.rating) || 0)));
            return (
              <div key={rev.id || `${rev.date}-${rev.name}`} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: "bold", fontSize: 14 }}>{rev.name}</span>
                    <span style={{ fontSize: 11, color: "#8a6040", marginLeft: 10 }}>მაგიდა {rev.table}</span>
                  </div>
                  <div style={{ color: "#f59e0b" }}>
                    {"★".repeat(rating)}{"☆".repeat(5 - rating)}
                  </div>
                </div>
                {rev.comment && (
                  <p style={{ color: "#cbd5e1", fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{rev.comment}</p>
                )}
                <div style={{ fontSize: 10, color: "#8a6040" }}>{rev.date}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
