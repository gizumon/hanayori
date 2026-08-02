"use client";

import {
  Armchair,
  Eye,
  ImageIcon,
  Link2,
  MoreVertical,
  Pencil,
  QrCode,
  Ticket,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { THEMES } from "../constants";
import styles from "../letter-studio.module.css";
import type { Letter } from "../types";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface LetterRowProps {
  letter: Letter;
  cardEnabled: boolean;
  escortEnabled: boolean;
  pFont: string;
  cFont: string;
  cardName: string;
  /** エスコートカードに載る名前(イベント既定の敬称込み)。 */
  escortName: string;
  /**
   * 作成者として表示する文字列。null = 表示しない。
   * 1 人だけのイベントでは意味がないので、呼び出し側で null にして省く。
   */
  creatorLabel: string | null;
  letterUrl: string;
  deletingLetter: boolean;
  onEdit: () => void;
  onShowQr: () => void;
  onShowEscort: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
}

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
  color: COLOR.ink,
  cursor: "pointer",
};

/** カード下段の情報チップ。席札名・卓番などを小さく並べる。 */
function Chip({
  icon,
  children,
  accent,
  muted,
  font,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  accent: string;
  muted?: boolean;
  font?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        maxWidth: "100%",
        padding: "4px 10px",
        borderRadius: 999,
        background: COLOR.surfaceRaised,
        border: `1px solid ${muted ? COLOR.border : `${accent}66`}`,
        color: muted ? COLOR.inkFaint : COLOR.ink,
        fontSize: FONT_SIZE.micro,
        letterSpacing: "0.06em",
        lineHeight: 1.5,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <span aria-hidden="true" style={{ display: "flex", flex: "none", opacity: 0.85 }}>
        {icon}
      </span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontFamily: font,
        }}
      >
        {children}
      </span>
    </span>
  );
}

export function LetterRow({
  letter: l,
  cardEnabled,
  escortEnabled,
  pFont,
  cFont,
  cardName,
  escortName,
  creatorLabel,
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
  const theme = THEMES[l.theme];
  const accent = theme.accent;
  const preview = l.body.replace(/\s+/g, " ").trim();

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
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      className={styles.cardTile}
      style={{
        position: "relative",
        // メニューを開いている間だけ手前に出す(次のカードに潜り込ませない)。
        zIndex: menuOpen ? 20 : undefined,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: theme.paper,
        border: `1px solid ${theme.rule}`,
        padding: "16px 16px 14px 32px",
        boxShadow: "0 6px 20px rgba(150,110,130,0.12)",
      }}
    >
      {/* 便箋の左余白罫(細い二重線)。メニューを切らないよう overflow は掛けない。 */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 16,
          top: 12,
          bottom: 12,
          width: 1,
          background: accent,
          opacity: 0.55,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 19,
          top: 12,
          bottom: 12,
          width: 1,
          background: accent,
          opacity: 0.25,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          minHeight: 28,
        }}
      >
        <span
          style={{
            fontSize: FONT_SIZE.heading,
            fontWeight: 600,
            letterSpacing: "0.08em",
            fontFamily: pFont,
            color: theme.ink,
          }}
        >
          {l.to}
        </span>
        <span
          style={{
            fontSize: FONT_SIZE.micro,
            letterSpacing: "0.14em",
            color: COLOR.inkFaint,
          }}
        >
          {theme.label}
        </span>
        <span style={{ flex: 1 }} />
        {/* その他の操作。カード全体がクリック対象なので伝播は止める。 */}
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{ position: "relative", alignSelf: "flex-start", flex: "none", marginTop: -4 }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="その他の操作"
            aria-expanded={menuOpen}
            className={styles.optionRow}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              padding: 0,
              border: "none",
              borderRadius: 6,
              background: "none",
              color: COLOR.inkFaint,
            }}
          >
            <MoreVertical size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                zIndex: 10,
                minWidth: 168,
                background: COLOR.surfaceRaised,
                border: `1px solid ${COLOR.border}`,
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(150,110,130,0.22)",
                padding: 6,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <a
                href={letterUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
                className={styles.optionRow}
                style={{ ...menuItemStyle, borderRadius: 8, textDecoration: "none" }}
              >
                <Eye size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
                受け取るお手紙を確認
              </a>
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
                  color: COLOR.danger,
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
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* 本文プレビューは便箋の罫線の上に書いたように見せる(行送り 26px に罫線を合わせる)。 */}
        <p
          style={{
            margin: "2px 0 0",
            fontSize: FONT_SIZE.bodySm,
            color: preview ? COLOR.inkSoft : COLOR.inkFaint,
            letterSpacing: "0.04em",
            lineHeight: "26px",
            fontFamily: pFont,
            backgroundImage: `repeating-linear-gradient(180deg, transparent 0 25px, ${theme.rule} 25px 26px)`,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {preview || "本文はまだ書かれていません"}
        </p>
        {/* 下段。設定チップと編集マークを同じ行に置く。 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 6,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
            {cardEnabled && (
              <Chip icon={<QrCode size={11} strokeWidth={1.9} />} accent={accent} font={cFont}>
                席札 {cardName}
              </Chip>
            )}
            {escortEnabled && (
              <Chip icon={<Ticket size={11} strokeWidth={1.9} />} accent={accent} font={cFont}>
                エスコート {escortName}
              </Chip>
            )}
            {escortEnabled &&
              (l.tableNo ? (
                <Chip icon={<Armchair size={11} strokeWidth={1.9} />} accent={accent}>
                  {l.tableNo}
                </Chip>
              ) : (
                <Chip icon={<Armchair size={11} strokeWidth={1.9} />} accent={accent} muted>
                  卓番未設定
                </Chip>
              ))}
            {l.photo && (
              <Chip icon={<ImageIcon size={11} strokeWidth={1.9} />} accent={accent}>
                写真あり
              </Chip>
            )}
            {creatorLabel && (
              <Chip icon={<UserRound size={11} strokeWidth={1.9} />} accent={accent} muted>
                {creatorLabel}
              </Chip>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={styles.optionRow}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              marginLeft: "auto",
              padding: "4px 6px",
              border: "none",
              borderRadius: 6,
              background: "none",
              color: COLOR.inkFaint,
              fontSize: FONT_SIZE.caption,
              letterSpacing: "0.08em",
            }}
          >
            <Pencil size={13} strokeWidth={1.8} aria-hidden="true" />
            編集
          </button>
        </div>
      </div>
    </div>
  );
}
