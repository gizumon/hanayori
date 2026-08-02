"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { FONTS } from "./constants";
import styles from "./letter-studio.module.css";
import type { FontKey } from "./types";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

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
        background: active ? COLOR.accent : COLOR.surfaceRaised,
        color: active ? COLOR.onAccent : COLOR.ink,
        border: active ? `1px solid ${COLOR.accent}` : `1px solid ${COLOR.border}`,
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
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
          <span style={{ fontSize: FONT_SIZE.micro, color: COLOR.accentInk, letterSpacing: "0.04em" }}>
            {FONTS[value].label}
          </span>
          <ChevronDown size={15} style={{ color: COLOR.accentInk }} />
        </span>
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(60,42,46,0.4)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(360px,92vw)",
              maxHeight: "min(480px,80vh)",
              background: COLOR.surface,
              borderRadius: 18,
              boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(211,165,180,0.3)",
                fontSize: FONT_SIZE.caption,
                letterSpacing: "0.1em",
                color: COLOR.inkSoft,
              }}
            >
              フォントを選ぶ
            </div>
            <div role="listbox" style={{ overflowY: "auto", padding: 6 }}>
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
                  className={styles.optionRow}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "12px 14px",
                    border: "none",
                    borderRadius: 10,
                    background: value === k ? COLOR.tint : "transparent",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS[k].family,
                      fontSize: FONT_SIZE.input,
                      color: COLOR.ink,
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
                      color: COLOR.accentInk,
                      letterSpacing: "0.04em",
                      flex: "none",
                    }}
                  >
                    {FONTS[k].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
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
        color: COLOR.inkSoft,
        letterSpacing: "0.06em",
        cursor: "pointer",
      }}
    >
      <span
        className={styles.toggleTrack}
        style={{ background: checked ? COLOR.accent : COLOR.accentOff }}
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
    border: `1px solid ${COLOR.border}`,
    background: COLOR.surfaceRaised,
    fontSize: FONT_SIZE.input,
    color: COLOR.ink,
    outline: "none",
    ...extra,
  };
}
