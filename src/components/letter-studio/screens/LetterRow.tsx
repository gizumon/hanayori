"use client";

import { ArrowUpRight, Link2, Mail, MoreVertical, QrCode, Ticket, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { THEMES } from "../constants";
import styles from "../letter-studio.module.css";
import type { Letter } from "../types";
import { FONT_SIZE } from "@/lib/typography";

interface LetterRowProps {
  letter: Letter;
  cardEnabled: boolean;
  escortEnabled: boolean;
  pFont: string;
  cFont: string;
  cardName: string;
  letterUrl: string;
  deletingLetter: boolean;
  onEdit: () => void;
  onShowQr: () => void;
  onShowEscort: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
}

const pillStyle = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid #EBD9DF",
  background: "#FFFFFF",
  color: "#5C4A4A",
  fontSize: FONT_SIZE.label,
  letterSpacing: "0.06em",
};

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "10px 14px",
  border: "none",
  background: "none",
  textAlign: "left" as const,
  fontSize: FONT_SIZE.bodySm,
  letterSpacing: "0.04em",
  color: "#5C4A4A",
  cursor: "pointer",
};

export function LetterRow({
  letter: l,
  cardEnabled,
  escortEnabled,
  pFont,
  cFont,
  cardName,
  letterUrl,
  deletingLetter,
  onEdit,
  onShowQr,
  onShowEscort,
  onCopyLink,
  onDelete,
}: LetterRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const accent = THEMES[l.theme].accent;

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "#FFFCF8",
        borderRadius: 14,
        padding: "16px 20px",
        boxShadow: "0 6px 20px rgba(150,110,130,0.12)",
        flexWrap: "wrap",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `${accent}22`,
          border: `1px solid ${accent}66`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <Mail size={19} strokeWidth={1.6} color={accent} />
      </span>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: FONT_SIZE.heading, fontWeight: 600, letterSpacing: "0.08em", fontFamily: pFont }}>
          {l.to}
        </div>
        <div
          style={{
            fontSize: FONT_SIZE.bodySm,
            color: "#8C7676",
            letterSpacing: "0.04em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 420,
            fontFamily: pFont,
          }}
        >
          {l.body.replace(/\n+/g, " ").slice(0, 40)}
        </div>
        {cardEnabled && (
          <div
            style={{
              fontSize: FONT_SIZE.caption,
              color: "#B08A99",
              letterSpacing: "0.06em",
              marginTop: 3,
              fontFamily: cFont,
            }}
          >
            席札: {cardName}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={onEdit} className={styles.btnOutline} style={pillStyle}>
          編集
        </button>
        <a
          href={letterUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.btnSolid}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: "#D3A5B4",
            color: "#FFF9F5",
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.06em",
            textDecoration: "none",
          }}
        >
          お手紙を開く
          <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
        </a>
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="その他の操作"
            aria-expanded={menuOpen}
            className={styles.btnOutline}
            style={{ ...pillStyle, padding: "8px 10px", display: "flex", alignItems: "center" }}
          >
            <MoreVertical size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                zIndex: 10,
                minWidth: 168,
                background: "#FFFFFF",
                border: "1px solid #EBD9DF",
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(150,110,130,0.22)",
                padding: 6,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {cardEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    onShowQr();
                    setMenuOpen(false);
                  }}
                  className={styles.optionRow}
                  style={{ ...menuItemStyle, borderRadius: 8 }}
                >
                  <QrCode size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
                  QRカード
                </button>
              )}
              {escortEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    onShowEscort();
                    setMenuOpen(false);
                  }}
                  className={styles.optionRow}
                  style={{ ...menuItemStyle, borderRadius: 8 }}
                >
                  <Ticket size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
                  エスコートカード
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onCopyLink();
                  setMenuOpen(false);
                }}
                className={styles.optionRow}
                style={{ ...menuItemStyle, borderRadius: 8 }}
              >
                <Link2 size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
                リンクをコピー
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`「${l.to}」を削除しますか？この操作は取り消せません。`)) {
                    onDelete();
                  }
                  setMenuOpen(false);
                }}
                disabled={deletingLetter}
                className={styles.optionRow}
                style={{
                  ...menuItemStyle,
                  borderRadius: 8,
                  color: "#B5555F",
                  opacity: deletingLetter ? 0.6 : 1,
                  cursor: deletingLetter ? "default" : "pointer",
                }}
              >
                <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
                削除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
