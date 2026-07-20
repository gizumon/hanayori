"use client";

import { fieldStyle } from "./controls";
import styles from "./letter-studio.module.css";

interface NewEventModalProps {
  name: string;
  date: string;
  onChangeName: (v: string) => void;
  onChangeDate: (v: string) => void;
  onCancel: () => void;
  onCreate: () => void;
}

export function NewEventModal({
  name,
  date,
  onChangeName,
  onChangeDate,
  onCancel,
  onCreate,
}: NewEventModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(60,42,46,0.5)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          width: "min(380px,92vw)",
          background: "#FFFCF8",
          borderRadius: 18,
          padding: "30px 28px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: "0.12em" }}>
          新しいイベント
        </h3>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 12.5,
            letterSpacing: "0.1em",
            color: "#8C7676",
          }}
        >
          イベント名
          <input
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="ゆい & 蓮 の結婚式"
            className={styles.field}
            style={fieldStyle({ padding: "12px 14px", fontSize: 15 })}
            autoFocus
          />
        </label>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 12.5,
            letterSpacing: "0.1em",
            color: "#8C7676",
          }}
        >
          挙式日
          <input
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            placeholder="2026年10月24日(土)"
            className={styles.field}
            style={fieldStyle({ padding: "12px 14px", fontSize: 15 })}
          />
        </label>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
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
            キャンセル
          </button>
          <button
            type="button"
            onClick={onCreate}
            className={styles.btnSolid}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background: "#D3A5B4",
              color: "#FFF9F5",
              fontSize: 13,
              letterSpacing: "0.06em",
            }}
          >
            作成する
          </button>
        </div>
      </div>
    </div>
  );
}
