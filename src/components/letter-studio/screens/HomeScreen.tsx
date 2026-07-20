"use client";

import styles from "../letter-studio.module.css";
import type { EventSummary } from "../types";

interface HomeScreenProps {
  projects: EventSummary[];
  onOpen: (id: string) => void;
  onNew: () => void;
}

export function HomeScreen({ projects, onOpen, onNew }: HomeScreenProps) {
  return (
    <main
      className={styles.fadeup}
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "36px clamp(16px,4vw,40px) 80px",
      }}
    >
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, letterSpacing: "0.14em" }}>
        イベント
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: 12.5, color: "#8C7676", letterSpacing: "0.05em" }}>
        イベントごとのお手紙をまとめて管理できます
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 18,
        }}
      >
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(p.id)}
            className={styles.cardTile}
            style={{
              textAlign: "left",
              background: "#FFFCF8",
              border: "none",
              borderRadius: 16,
              padding: "24px 22px",
              boxShadow: "0 8px 28px rgba(150,110,130,0.14)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 16.5,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#5C4A4A",
              }}
            >
              {p.name}
            </span>
            <span style={{ fontSize: 12, color: "#8C7676", letterSpacing: "0.08em" }}>
              {p.date}
            </span>
            <span
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#B08A99",
                letterSpacing: "0.06em",
                borderTop: "1px dashed #F0E2E7",
                paddingTop: 10,
                width: "100%",
              }}
            >
              お手紙 {p.letterCount} 通
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={onNew}
          className={styles.dashedAdd}
          style={{
            minHeight: 150,
            background: "transparent",
            border: "1.5px dashed #D3A5B4",
            borderRadius: 16,
            color: "#B08A99",
            fontSize: 13.5,
            letterSpacing: "0.1em",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 300, lineHeight: 1 }}>+</span>
          新しいイベント
        </button>
      </div>
    </main>
  );
}
