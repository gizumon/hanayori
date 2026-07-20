"use client";

import styles from "../letter-studio.module.css";

interface AppHeaderProps {
  onLogout: () => void;
}

export function AppHeader({ onLogout }: AppHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px clamp(16px,4vw,40px)",
        borderBottom: "1px solid rgba(211,165,180,0.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: "0.1em",
            color: "#5C4A4A",
          }}
        >
          Hanayori
        </span>
        <span style={{ fontSize: 11, letterSpacing: "0.28em", color: "#B08A99" }}>
          花嫁のお便り
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            color: "#8C7676",
            letterSpacing: "0.05em",
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#E2B6C3,#D3A5B4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF9F5",
              fontSize: 12,
            }}
          >
            結
          </span>
          ゆい さん
        </span>
        <button
          type="button"
          onClick={onLogout}
          className={styles.btnGhost}
          style={{
            padding: "7px 14px",
            borderRadius: 999,
            border: "1px solid #EBD9DF",
            background: "transparent",
            color: "#8C7676",
            fontSize: 12,
            letterSpacing: "0.06em",
          }}
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
