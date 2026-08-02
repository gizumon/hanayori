"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { Download, FileText, LogOut, Pencil, ShieldCheck } from "lucide-react";
import { fieldStyle } from "../controls";
import styles from "../letter-studio.module.css";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { PWAInstallModal } from "@/components/pwa/PWAInstallModal";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

/** アカウントメニューの行（規約・ポリシーのリンク）の見た目。隣の button 群と揃える。 */
const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  textAlign: "left",
  borderRadius: 8,
  padding: "9px 8px",
  fontSize: FONT_SIZE.bodySm,
  color: COLOR.inkSoft,
  letterSpacing: "0.04em",
  textDecoration: "none",
} as const;

interface AppHeaderProps {
  userName: string;
  /** プロフィール写真(Google ログイン等)。null なら頭文字を表示する。 */
  userPhoto: string | null;
  onLogout: () => void;
  onUpdateName: (name: string) => void | Promise<void>;
  onGoHome: () => void;
}

export function AppHeader({
  userName,
  userPhoto,
  onLogout,
  onUpdateName,
  onGoHome,
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [draftName, setDraftName] = useState(userName);
  const { isInstalled, platform, canPrompt, promptInstall } = usePWAInstall();
  const canInstall = !isInstalled && (canPrompt || platform === "ios");
  const submittedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initial = userName ? userName.charAt(0) : "結";

  const closeAll = () => {
    setMenuOpen(false);
    setEditing(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const startEdit = () => {
    submittedRef.current = false;
    setDraftName(userName);
    setEditing(true);
  };

  const commit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const trimmed = draftName.trim();
    closeAll();
    if (trimmed) {
      void onUpdateName(trimmed);
    }
  };

  const handleInstall = async () => {
    if (canPrompt) {
      closeAll();
      await promptInstall();
    } else if (platform === "ios") {
      setMenuOpen(false);
      setIosGuideOpen(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
    }
  };

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
      <button
        type="button"
        onClick={onGoHome}
        aria-label="イベント一覧へ戻る"
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          border: "none",
          background: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: "'Shippori Mincho', serif",
            fontSize: FONT_SIZE.heading,
            fontWeight: 500,
            letterSpacing: "0.1em",
            color: COLOR.ink,
          }}
        >
          Hanayori
        </span>
        <span style={{ fontSize: FONT_SIZE.overline, letterSpacing: "0.28em", color: COLOR.accentInk }}>
          花嫁のお便り
        </span>
      </button>

      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid transparent",
            background: menuOpen ? "rgba(211,165,180,0.14)" : "transparent",
            borderRadius: 999,
            padding: "4px 10px 4px 4px",
            cursor: "pointer",
            fontSize: FONT_SIZE.label,
            color: COLOR.inkSoft,
            letterSpacing: "0.05em",
          }}
        >
          {/* 写真があればそれを、無ければ従来どおりアクセント色の頭文字を出す。 */}
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: userPhoto
                ? `center/cover no-repeat url(${userPhoto})`
                : `linear-gradient(135deg,${COLOR.accentPale},${COLOR.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.caption,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {userPhoto ? "" : initial}
          </span>
          {userName ? `${userName} さん` : "ゲスト"}
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 240,
              background: COLOR.surface,
              borderRadius: 14,
              boxShadow: "0 12px 32px rgba(150,110,130,0.24)",
              border: `1px solid ${COLOR.borderSoft}`,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              zIndex: 20,
            }}
          >
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "6px 8px" }}>
                <label
                  style={{ fontSize: FONT_SIZE.caption, letterSpacing: "0.08em", color: COLOR.inkSoft }}
                >
                  ニックネーム
                </label>
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={30}
                  className={styles.field}
                  style={fieldStyle({ padding: "8px 10px", fontSize: FONT_SIZE.input })}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <button
                    type="button"
                    onClick={commit}
                    className={styles.btnSolid}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 999,
                      border: "none",
                      background: COLOR.accent,
                      color: COLOR.onAccent,
                      fontSize: FONT_SIZE.label,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 999,
                      border: `1px solid ${COLOR.border}`,
                      background: "transparent",
                      color: COLOR.inkSoft,
                      fontSize: FONT_SIZE.label,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    borderRadius: 8,
                    padding: "9px 8px",
                    cursor: "pointer",
                    fontSize: FONT_SIZE.bodySm,
                    color: COLOR.ink,
                    letterSpacing: "0.04em",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(211,165,180,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Pencil
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    style={{ color: COLOR.accentInk, flex: "none" }}
                  />
                  ニックネームを変更
                </button>
                {canInstall && (
                  <button
                    type="button"
                    onClick={handleInstall}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      borderRadius: 8,
                      padding: "9px 8px",
                      cursor: "pointer",
                      fontSize: FONT_SIZE.bodySm,
                      color: COLOR.ink,
                      letterSpacing: "0.04em",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(211,165,180,0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Download
                      size={13}
                      strokeWidth={1.8}
                      aria-hidden="true"
                      style={{ color: COLOR.accentInk, flex: "none" }}
                    />
                    アプリをインストール
                  </button>
                )}
                <div style={{ height: 1, background: COLOR.borderSoft, margin: "4px 2px" }} />
                {/* 作成中の内容を残したいので、規約類は別タブで開く。 */}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeAll}
                  style={menuItemStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(211,165,180,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <FileText
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    style={{ color: COLOR.accentInk, flex: "none" }}
                  />
                  利用規約
                </Link>
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeAll}
                  style={menuItemStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(211,165,180,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <ShieldCheck
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    style={{ color: COLOR.accentInk, flex: "none" }}
                  />
                  プライバシーポリシー
                </Link>
                <div style={{ height: 1, background: COLOR.borderSoft, margin: "4px 2px" }} />
                <button
                  type="button"
                  onClick={() => {
                    closeAll();
                    onLogout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    borderRadius: 8,
                    padding: "9px 8px",
                    cursor: "pointer",
                    fontSize: FONT_SIZE.bodySm,
                    color: COLOR.inkSoft,
                    letterSpacing: "0.04em",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(211,165,180,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    style={{ color: COLOR.accentInk, flex: "none" }}
                  />
                  ログアウト
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {iosGuideOpen && <PWAInstallModal onClose={() => setIosGuideOpen(false)} />}
    </header>
  );
}
