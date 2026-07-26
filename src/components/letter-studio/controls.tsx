"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { FONTS } from "./constants";
import styles from "./letter-studio.module.css";
import type { FontKey } from "./types";
import { FONT_SIZE } from "@/lib/typography";

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
        fontSize: size === "sm" ? FONT_SIZE.caption : FONT_SIZE.label,
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

interface FontSelectProps {
  value: FontKey;
  onChange: (key: FontKey) => void;
  sample: string;
}

export function FontSelect({ value, onChange, sample }: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={styles.field}
        style={fieldStyle({
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: "pointer",
        })}
      >
        <span
          style={{
            fontFamily: FONTS[value].family,
            fontSize: FONT_SIZE.input,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sample}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
          <span style={{ fontSize: FONT_SIZE.micro, color: "#B08A99", letterSpacing: "0.04em" }}>
            {FONTS[value].label}
          </span>
          <ChevronDown
            size={15}
            style={{
              color: "#B08A99",
              transition: "transform 0.15s",
              transform: open ? "rotate(180deg)" : undefined,
            }}
          />
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "#FFFFFF",
            border: "1px solid #EBD9DF",
            borderRadius: 12,
            boxShadow: "0 12px 30px rgba(80,50,60,0.18)",
            overflow: "hidden",
          }}
        >
          {(Object.keys(FONTS) as FontKey[]).map((k) => (
            <button
              key={k}
              type="button"
              role="option"
              aria-selected={value === k}
              onClick={() => {
                onChange(k);
                setOpen(false);
              }}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 14px",
                border: "none",
                borderBottom: "1px solid #F3E8EC",
                background: value === k ? "#FBF1F4" : "#FFFFFF",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontFamily: FONTS[k].family,
                  fontSize: FONT_SIZE.input,
                  color: "#5C4A4A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {sample}
              </span>
              <span
                style={{
                  fontSize: FONT_SIZE.micro,
                  color: "#B08A99",
                  letterSpacing: "0.04em",
                  flex: "none",
                }}
              >
                {FONTS[k].label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
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
        fontSize: FONT_SIZE.label,
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
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid #EBD9DF",
    background: "#FFFFFF",
    fontSize: FONT_SIZE.input,
    color: "#5C4A4A",
    outline: "none",
    ...extra,
  };
}
