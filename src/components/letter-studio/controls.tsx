"use client";

import type { CSSProperties, ReactNode } from "react";
import styles from "./letter-studio.module.css";

interface PillButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  title?: string;
  "aria-label"?: string;
}

export function PillButton({
  label,
  active,
  onClick,
  size = "md",
  title,
  ...aria
}: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={aria["aria-label"]}
      className={styles.btnOutline}
      style={{
        padding: size === "sm" ? "8px 14px" : "8px 18px",
        borderRadius: 999,
        fontSize: size === "sm" ? 12 : 12.5,
        letterSpacing: "0.06em",
        cursor: "pointer",
        background: active ? "#D3A5B4" : "#FFFFFF",
        color: active ? "#FFF9F5" : "#5C4A4A",
        border: active ? "1px solid #D3A5B4" : "1px solid #EBD9DF",
      }}
    >
      {label}
    </button>
  );
}

interface FontOptionRowProps {
  label: string;
  family: string;
  sample: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function FontOptionRow({
  label,
  family,
  sample,
  active,
  onClick,
  compact = false,
}: FontOptionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.optionRow}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 14,
        padding: compact ? "11px 14px" : "14px 16px",
        background: active ? "#FBF1F4" : "#FFFFFF",
        border: "none",
        borderBottom: "1px solid #F3E8EC",
        textAlign: "left",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: compact ? 14 : 16,
          height: compact ? 14 : 16,
          borderRadius: "50%",
          flex: "none",
          border: active ? "5px solid #D3A5B4" : "1.5px solid #D9C3CA",
          background: active ? "#D3A5B4" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: compact ? 6 : 7,
            height: compact ? 6 : 7,
            borderRadius: "50%",
            background: "#FFF9F5",
            display: active ? "block" : "none",
          }}
        />
      </span>
      <span
        style={{
          fontSize: compact ? 11 : 11.5,
          color: "#8C7676",
          letterSpacing: "0.06em",
          flex: "none",
          width: compact ? 88 : 110,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: family,
          fontSize: compact ? 15 : 17,
          color: "#5C4A4A",
          letterSpacing: "0.04em",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {sample}
      </span>
    </button>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        fontSize: 12.5,
        color: "#8C7676",
        letterSpacing: "0.06em",
        cursor: "pointer",
      }}
    >
      <span
        className={styles.toggleTrack}
        style={{ background: checked ? "#D3A5B4" : "#E3D2D8" }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={styles.toggleInput}
        />
        <span
          aria-hidden="true"
          className={styles.toggleKnob}
          style={{ left: checked ? 18 : 2 }}
        />
      </span>
      {label}
    </label>
  );
}

export function fieldStyle(extra?: CSSProperties): CSSProperties {
  return {
    padding: "11px 13px",
    borderRadius: 10,
    border: "1px solid #EBD9DF",
    background: "#FFFFFF",
    fontSize: 16,
    color: "#5C4A4A",
    outline: "none",
    ...extra,
  };
}
