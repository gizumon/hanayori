"use client";

import styles from "./letter-studio.module.css";

interface ConfirmDialogProps {
  message: string;
  stayLabel?: string;
  leaveLabel?: string;
  onStay: () => void;
  onLeave: () => void;
}

export function ConfirmDialog({
  message,
  stayLabel = "編集を続ける",
  leaveLabel = "保存せずに移動する",
  onStay,
  onLeave,
}: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(60,42,46,0.4)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          width: "min(360px,92vw)",
          background: "#FFFCF8",
          borderRadius: 18,
          padding: "26px 26px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: 1.7,
            color: "#5C4A4A",
            letterSpacing: "0.04em",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onLeave}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid #EBD9DF",
              background: "transparent",
              color: "#8C7676",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {leaveLabel}
          </button>
          <button
            type="button"
            onClick={onStay}
            className={styles.btnSolid}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background: "#D3A5B4",
              color: "#FFF9F5",
              fontSize: 13,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            {stayLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
