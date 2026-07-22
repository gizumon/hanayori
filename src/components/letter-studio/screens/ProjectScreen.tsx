"use client";

import { Settings } from "lucide-react";
import { FONTS } from "../constants";
import styles from "../letter-studio.module.css";
import type { Letter, Project } from "../types";
import { LetterRow } from "./LetterRow";

interface ProjectScreenProps {
  project: Project;
  letters: Letter[];
  loadingLetters: boolean;
  onBack: () => void;
  onOpenSettings: () => void;
  onNewLetter: () => void;
  onEditLetter: (letter: Letter) => void;
  onShowQr: (letter: Letter) => void;
  onCopyLink: (id: string) => void;
  onDeleteLetter: (letter: Letter) => void;
  deletingLetter: boolean;
  letterUrl: (id: string) => string;
  cardNameFor: (letter: Letter) => string;
}

export function ProjectScreen({
  project,
  letters,
  loadingLetters,
  onBack,
  onOpenSettings,
  onNewLetter,
  onEditLetter,
  onShowQr,
  onCopyLink,
  onDeleteLetter,
  deletingLetter,
  letterUrl,
  cardNameFor,
}: ProjectScreenProps) {
  const cardEnabled = project.cardConfig.enabled;
  const pFont = FONTS[project.letterConfig.font].family;
  const cFont = FONTS[project.cardConfig.font].family;

  return (
    <main
      className={styles.fadeup}
      style={{ maxWidth: 960, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 80px" }}
    >
      <button
        type="button"
        onClick={onBack}
        className={styles.linkBack}
        style={{
          border: "none",
          background: "none",
          color: "#B08A99",
          fontSize: 12.5,
          letterSpacing: "0.08em",
          padding: 0,
          marginBottom: 14,
        }}
      >
        ← イベント一覧
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600, letterSpacing: "0.12em" }}>
            {project.name}
          </h2>
          <p style={{ margin: 0, fontSize: 12.5, color: "#8C7676", letterSpacing: "0.08em" }}>
            {project.date}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className={styles.btnOutline}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 20px",
            borderRadius: 999,
            border: "1px solid #EBD9DF",
            background: "#FFFFFF",
            color: "#5C4A4A",
            fontSize: 13,
            letterSpacing: "0.08em",
          }}
        >
          <Settings size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none", color: "#B08A99" }} />
          共通設定
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          type="button"
          onClick={onNewLetter}
          className={styles.dashedAdd}
          style={{
            background: "transparent",
            border: "1.5px dashed #D3A5B4",
            borderRadius: 14,
            color: "#B08A99",
            fontSize: 13.5,
            letterSpacing: "0.1em",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 300, lineHeight: 1 }}>+</span>
          新しいお手紙を書く
        </button>
        {loadingLetters &&
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "#FFFCF8",
                borderRadius: 14,
                padding: "16px 20px",
                boxShadow: "0 6px 20px rgba(150,110,130,0.12)",
              }}
            >
              <div
                className={styles.skeleton}
                style={{ width: 34, height: 34, borderRadius: "50%", flex: "none" }}
              />
              <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className={styles.skeleton} style={{ height: 16, width: "30%" }} />
                <div className={styles.skeleton} style={{ height: 12, width: "55%" }} />
              </div>
            </div>
          ))}
        {!loadingLetters &&
          letters.map((l) => (
            <LetterRow
              key={l.id}
              letter={l}
              cardEnabled={cardEnabled}
              pFont={pFont}
              cFont={cFont}
              cardName={cardNameFor(l)}
              letterUrl={letterUrl(l.id)}
              deletingLetter={deletingLetter}
              onEdit={() => onEditLetter(l)}
              onShowQr={() => onShowQr(l)}
              onCopyLink={() => onCopyLink(l.id)}
              onDelete={() => onDeleteLetter(l)}
            />
          ))}
      </div>

      <h4
        style={{
          margin: "36px 0 4px",
          fontSize: 13.5,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "#8C7676",
        }}
      >
        全手紙共通ページ
      </h4>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#B4A2A2", letterSpacing: "0.05em" }}>
        お手紙の最後からリンクできる共通コンテンツ(近日公開)
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 14,
          maxWidth: 680,
        }}
      >
        {["新郎新婦プロフィール", "座席表", "お料理メニュー"].map((label) => (
          <div
            key={label}
            style={{
              background: "rgba(255,252,248,0.55)",
              border: "1px dashed #E3CBD4",
              borderRadius: 14,
              padding: 18,
              color: "#B4A2A2",
            }}
          >
            <div style={{ fontSize: 14, letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.08em" }}>Coming soon</div>
          </div>
        ))}
      </div>
    </main>
  );
}
