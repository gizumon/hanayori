"use client";

import { DatePicker } from "@/components/DatePicker";
import { fieldStyle } from "./controls";
import { isoToJaDate, jaDateToIso } from "@/lib/date";
import styles from "./letter-studio.module.css";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";

interface NewEventModalProps {
  name: string;
  date: string;
  onChangeName: (v: string) => void;
  onChangeDate: (v: string) => void;
  onCancel: () => void;
  onCreate: () => void;
  creating: boolean;
}

export function NewEventModal({
  name,
  date,
  onChangeName,
  onChangeDate,
  onCancel,
  onCreate,
  creating,
}: NewEventModalProps) {
  useScrollLock();
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
        <h3 style={{ margin: 0, fontSize: FONT_SIZE.heading, fontWeight: 600, letterSpacing: "0.12em" }}>
          新しいイベント
        </h3>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.1em",
            color: "#8C7676",
          }}
        >
          イベント名
          <input
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="◯◯ & ◯◯ の結婚式"
            className={styles.field}
            style={fieldStyle({ padding: "12px 14px", fontSize: FONT_SIZE.input })}
            autoFocus
          />
        </label>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.1em",
            color: "#8C7676",
          }}
        >
          挙式日
          <DatePicker
            value={jaDateToIso(date)}
            onChange={(iso) => onChangeDate(isoToJaDate(iso))}
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
              fontSize: FONT_SIZE.bodySm,
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className={styles.btnSolid}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background: "#D3A5B4",
              color: "#FFF9F5",
              fontSize: FONT_SIZE.bodySm,
              letterSpacing: "0.06em",
              opacity: creating ? 0.6 : 1,
              cursor: creating ? "default" : "pointer",
            }}
          >
            {creating ? "作成中…" : "作成する"}
          </button>
        </div>
      </div>
    </div>
  );
}
