"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { LogOut, Pencil } from "lucide-react";
import { fieldStyle } from "../controls";
import styles from "../letter-studio.module.css";

interface AppHeaderProps {
  userName: string;
  onLogout: () => void;
  onUpdateName: (name: string) => void | Promise<void>;
  onGoHome: () => void;
}

export function AppHeader({ userName, onLogout, onUpdateName, onGoHome }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(userName);
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
              flexShrink: 0,
            }}
          >
            {initial}
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
              background: "#FFFCF8",
              borderRadius: 14,
              boxShadow: "0 12px 32px rgba(150,110,130,0.24)",
              border: "1px solid #F0E2E7",
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
                  style={{ fontSize: 11.5, letterSpacing: "0.08em", color: "#8C7676" }}
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
                  style={fieldStyle({ padding: "8px 10px", fontSize: 13.5 })}
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
                      background: "#D3A5B4",
                      color: "#FFF9F5",
                      fontSize: 12.5,
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
                      border: "1px solid #EBD9DF",
                      background: "transparent",
                      color: "#8C7676",
                      fontSize: 12.5,
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
                    fontSize: 13,
                    color: "#5C4A4A",
                    letterSpacing: "0.04em",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(211,165,180,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Pencil
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    style={{ color: "#B08A99", flex: "none" }}
                  />
                  ニックネームを変更
                </button>
                <div style={{ height: 1, background: "#F0E2E7", margin: "4px 2px" }} />
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
                    fontSize: 13,
                    color: "#8C7676",
                    letterSpacing: "0.04em",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(211,165,180,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    style={{ color: "#B08A99", flex: "none" }}
                  />
                  ログアウト
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
