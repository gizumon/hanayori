"use client";

import { useState } from "react";
import { ArrowUpRight, Eye, Settings } from "lucide-react";
import { FONTS, THEMES } from "../constants";
import { CardFields, EscortFields, LetterFields } from "../EditorFields";
import { QrCardFace } from "../QrCardFace";
import { EscortCardFace } from "../EscortCardFace";
import { LetterPreviewFace } from "../LetterPreviewFace";
import { LetterPreviewModal } from "../LetterPreviewModal";
import type { CardGeometry, EscortGeometry } from "../geometry";
import styles from "../letter-studio.module.css";
import type { CardConfig, Draft, EditorTab, EscortConfig, Letter, Project } from "../types";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface EditorScreenProps {
  project: Project;
  draft: Draft;
  edTab: EditorTab;
  cardConf: CardConfig;
  escortConf: EscortConfig;
  geometry: CardGeometry;
  escortGeometry: EscortGeometry;
  cardName: string;
  escortName: string;
  qrUrl: string;
  onBack: () => void;
  onEdTabChange: (t: EditorTab) => void;
  onChange: (patch: Partial<Letter>) => void;
  onUploadEscortPhoto: (file: File) => void;
  onRemoveEscortPhoto: () => void;
  onOpenSettings: () => void;
  onOpenCardSettings: () => void;
  onOpenEscortSettings: () => void;
  onSave: () => void;
  saving: boolean;
  letterUrl: string;
}

export function EditorScreen({
  project,
  draft,
  edTab,
  cardConf,
  escortConf,
  geometry: g,
  escortGeometry: eg,
  cardName,
  escortName,
  qrUrl,
  onBack,
  onEdTabChange,
  onChange,
  onUploadEscortPhoto,
  onRemoveEscortPhoto,
  onOpenSettings,
  onOpenCardSettings,
  onOpenEscortSettings,
  onSave,
  saving,
  letterUrl,
}: EditorScreenProps) {
  const theme = THEMES[draft.theme || "rose"];
  const pFont = FONTS[project.letterConfig.font].family;
  const cFont = FONTS[cardConf.font].family;
  const eFont = FONTS[escortConf.font].family;
  const cardEnabled = cardConf.enabled;
  const escortEnabled = escortConf.enabled;
  const showCardFields = edTab === "card" && cardEnabled;
  const showEscortFields = edTab === "escort" && escortEnabled;
  const showLetterFields = !showCardFields && !showEscortFields;
  const footText = cardConf.nameOverride.trim() || project.name;
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <main
      className={styles.fadeup}
      style={{ maxWidth: 1120, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 168px" }}
    >
      <button
        type="button"
        onClick={onBack}
        className={styles.linkBack}
        style={{
          border: "none",
          background: "none",
          color: COLOR.accentInk,
          fontSize: FONT_SIZE.label,
          letterSpacing: "0.08em",
          padding: 0,
          marginBottom: 14,
        }}
      >
        ← {project.name}
      </button>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div
          style={{
            flex: 1,
            minWidth: 300,
            maxWidth: 460,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: FONT_SIZE.title, fontWeight: 600, letterSpacing: "0.12em" }}>
              お手紙をつくる
            </h2>
            <button
              type="button"
              onClick={onOpenSettings}
              className={styles.btnOutline}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${COLOR.border}`,
                background: COLOR.surfaceRaised,
                color: COLOR.ink,
                fontSize: FONT_SIZE.label,
                letterSpacing: "0.06em",
                flex: "none",
              }}
            >
              <Settings size={13} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none", color: COLOR.accentInk }} />
              共通設定
            </button>
          </div>
          {(cardEnabled || escortEnabled) && (
            <div
              style={{
                display: "flex",
                gap: 4,
                background: "rgba(211,165,180,0.16)",
                borderRadius: 999,
                padding: 4,
                alignSelf: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {(
                [
                  ["letter", "お手紙"],
                  ...(cardEnabled ? [["card", "席札"] as const] : []),
                  ...(escortEnabled ? [["escort", "エスコート"] as const] : []),
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onEdTabChange(k)}
                  style={{
                    padding: "9px 22px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontSize: FONT_SIZE.bodySm,
                    letterSpacing: "0.08em",
                    background: edTab === k ? COLOR.surface : "transparent",
                    color: edTab === k ? COLOR.ink : COLOR.inkMuted,
                    fontWeight: edTab === k ? 600 : 400,
                    boxShadow: edTab === k ? "0 2px 8px rgba(150,110,130,0.18)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {showLetterFields && (
            <LetterFields value={draft} onChange={onChange} font={pFont} date={project.date} bodyRows={12} />
          )}

          {showCardFields && (
            <CardFields value={draft} onChange={onChange} cardConf={cardConf} onOpenSettings={onOpenCardSettings} />
          )}

          {showEscortFields && (
            <EscortFields
              value={draft}
              onChange={onChange}
              escortConf={escortConf}
              onUploadPhoto={onUploadEscortPhoto}
              onRemovePhoto={onRemoveEscortPhoto}
              onOpenSettings={onOpenEscortSettings}
            />
          )}
        </div>

        <div style={{ flex: 1.2, minWidth: 300, position: "sticky", top: 20 }}>
          <div style={{ fontSize: FONT_SIZE.label, letterSpacing: "0.14em", color: COLOR.inkSoft, marginBottom: 10 }}>
            {showCardFields
              ? "席札プレビュー"
              : showEscortFields
                ? "エスコートカードプレビュー"
                : "お手紙プレビュー"}
          </div>

          {showLetterFields && (
            <LetterPreviewFace
              to={draft.to || ""}
              body={draft.body || ""}
              photo={draft.photo}
              photoRatio={draft.photoRatio}
              date={project.date}
              font={pFont}
              theme={theme}
            />
          )}

          {showCardFields && (
            <>
              <div
                style={{
                  borderRadius: 16,
                  background: `linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
                  padding: "clamp(24px,4vw,40px) clamp(16px,3vw,30px)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <QrCardFace
                  width={g.w}
                  aspect={g.aspect}
                  paper={theme.paper}
                  accent={theme.accent}
                  gold={theme.gold}
                  ink={theme.ink}
                  inkSoft={theme.inkSoft}
                  font={cFont}
                  frame={cardConf.frame}
                  geometry={g}
                  cardName={cardName}
                  heading={cardConf.heading}
                  note={cardConf.note}
                  footText={footText}
                  date={project.date || ""}
                  qrUrl={qrUrl}
                  boxShadow="0 14px 40px rgba(150,110,130,0.22)"
                />
              </div>
              <p style={{ margin: "10px 0 0", fontSize: FONT_SIZE.caption, color: COLOR.inkFaint, letterSpacing: "0.05em", textAlign: "center" }}>
                実寸 {g.sizeLabel}
              </p>
            </>
          )}

          {showEscortFields && (
            <>
              <div
                style={{
                  borderRadius: 16,
                  background: `linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
                  padding: "clamp(24px,4vw,40px) clamp(16px,3vw,30px)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <EscortCardFace
                  style={escortConf.style}
                  width={eg.w}
                  aspect={eg.aspect}
                  paper={theme.paper}
                  accent={theme.accent}
                  gold={theme.gold}
                  ink={theme.ink}
                  inkSoft={theme.inkSoft}
                  font={eFont}
                  name={escortName}
                  tableNo={draft.tableNo || ""}
                  tableLabel={escortConf.tableLabel}
                  heading={escortConf.heading}
                  message={draft.escortMessage || ""}
                  photo={draft.escortPhoto || escortConf.defaultPhoto || ""}
                  footText={escortConf.nameOverride.trim() || project.name}
                  boxShadow="0 14px 40px rgba(150,110,130,0.22)"
                />
              </div>
              <p style={{ margin: "10px 0 0", fontSize: FONT_SIZE.caption, color: COLOR.inkFaint, letterSpacing: "0.05em", textAlign: "center" }}>
                実寸 {eg.sizeLabel}
              </p>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          background: COLOR.surface,
          borderTop: "1px solid rgba(211,165,180,0.3)",
          padding: "10px clamp(16px,4vw,40px) calc(10px + env(safe-area-inset-bottom))",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className={styles.btnOutline}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "12px 22px",
              borderRadius: 999,
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surfaceRaised,
              color: COLOR.ink,
              fontSize: FONT_SIZE.body,
              letterSpacing: "0.08em",
            }}
          >
            <Eye size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none", color: COLOR.accentInk }} />
            プレビュー
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={styles.btnSolid}
            style={{
              padding: "12px 26px",
              borderRadius: 999,
              border: "none",
              background: COLOR.accent,
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.body,
              letterSpacing: "0.08em",
              boxShadow: "0 6px 16px rgba(150,110,130,0.28)",
              opacity: saving ? 0.6 : 1,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "保存中…" : "保存する"}
          </button>
          <a
            href={letterUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.btnOutline}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "12px 22px",
              borderRadius: 999,
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surfaceRaised,
              color: COLOR.ink,
              fontSize: FONT_SIZE.body,
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            お手紙を開く
            <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
          </a>
          <p
            style={{
              margin: "0 0 0 auto",
              flex: "1 1 260px",
              minWidth: 0,
              fontSize: FONT_SIZE.caption,
              color: COLOR.inkFaint,
              letterSpacing: "0.05em",
            }}
          >
            「お手紙を開く」の前に保存してください。開封アニメーション付きで表示されます。
          </p>
        </div>
      </div>

      {previewOpen && (
        <LetterPreviewModal
          project={project}
          draft={draft}
          cardConf={cardConf}
          escortConf={escortConf}
          geometry={g}
          escortGeometry={eg}
          cardName={cardName}
          escortName={escortName}
          qrUrl={qrUrl}
          initialTab={edTab}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </main>
  );
}
