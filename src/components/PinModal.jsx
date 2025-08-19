// src/components/PinModal.jsx
import { useEffect, useState } from "react";

export default function PinModal({ pin, open, onClose, onCommentChange }) {
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!open || !pin) return;
    setMemo(pin.comment ?? pin.address ?? "");
  }, [open, pin]);

  if (!open || !pin) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "90vw",
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
          {pin.name || "장소"}
        </div>
        <div style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>
          {pin.googlePlaceId ? `GooglePlaceId: ${pin.googlePlaceId}` : ""}
        </div>

        <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>
          메모 (서버 description에 저장)
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={6}
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid #ddd",
            padding: 10,
            boxSizing: "border-box",
            fontSize: 14,
          }}
          placeholder="예) 점심 메뉴 메모, 예약번호 등"
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#eee",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => onCommentChange(memo)}
            style={{
              background: "#222",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
