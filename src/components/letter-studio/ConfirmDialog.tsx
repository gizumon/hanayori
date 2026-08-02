"use client";

import styles from "./letter-studio.module.css";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

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
  useScrollLock();
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
          background: COLOR.surface,
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
            fontSize: FONT_SIZE.body,
            lineHeight: 1.7,
            color: COLOR.ink,
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
              border: `1px solid ${COLOR.border}`,
              background: "transparent",
              color: COLOR.inkSoft,
              fontSize: FONT_SIZE.bodySm,
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
              background: COLOR.accent,
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.bodySm,
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
