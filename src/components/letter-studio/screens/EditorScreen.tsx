"use client";

import { useState } from "react";
import { ArrowUpRight, Eye, Settings } from "lucide-react";
import { FONTS, THEMES } from "../constants";
import { fieldStyle } from "../controls";
import { QrCardFace } from "../QrCardFace";
import { EscortCardFace } from "../EscortCardFace";
import { LetterPreviewFace } from "../LetterPreviewFace";
import { LetterPreviewModal } from "../LetterPreviewModal";
import type { CardGeometry, EscortGeometry } from "../geometry";
import styles from "../letter-studio.module.css";
import type { CardConfig, Draft, EditorTab, EscortConfig, Honor, Project } from "../types";
import { FONT_SIZE } from "@/lib/typography";

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
  onChangeTo: (v: string) => void;
  onChangeBody: (v: string) => void;
  onChangeCardName: (v: string) => void;
  onSetHonor: (h: Honor | null) => void;
  onChangeTableNo: (v: string) => void;
  onChangeEscortName: (v: string) => void;
  onChangeEscortMessage: (v: string) => void;
  onSetEscortHonor: (h: Honor | null) => void;
  onUploadEscortPhoto: (file: File) => void;
  onRemoveEscortPhoto: () => void;
  onSetTheme: (theme: Draft["theme"]) => void;
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
  onChangeTo,
  onChangeBody,
  onChangeCardName,
  onSetHonor,
  onChangeTableNo,
  onChangeEscortName,
  onChangeEscortMessage,
  onSetEscortHonor,
  onUploadEscortPhoto,
  onRemoveEscortPhoto,
  onSetTheme,
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
          color: "#B08A99",
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
                border: "1px solid #EBD9DF",
                background: "#FFFFFF",
                color: "#5C4A4A",
                fontSize: FONT_SIZE.label,
                letterSpacing: "0.06em",
                flex: "none",
              }}
            >
              <Settings size={13} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none", color: "#B08A99" }} />
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
                    background: edTab === k ? "#FFFCF8" : "transparent",
                    color: edTab === k ? "#5C4A4A" : "#A38A93",
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
              宛名
              <input
                value={draft.to || ""}
                onChange={(e) => onChangeTo(e.target.value)}
                placeholder="山田花子へ"
                className={styles.field}
                style={fieldStyle({
                  padding: "12px 14px",
                  fontSize: FONT_SIZE.input,
                  background: "#FFFCF8",
                  letterSpacing: "0.05em",
                })}
              />
            </label>
          )}
          {showLetterFields && (
            <div style={{ fontSize: FONT_SIZE.caption, color: "#B4A2A2", letterSpacing: "0.06em" }}>
              日付はイベントの挙式日({project.date ?? ""})が使われます
            </div>
          )}

          {showCardFields && (
            <>
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
                席札の氏名
                <input
                  value={draft.cardName || ""}
                  onChange={(e) => onChangeCardName(e.target.value)}
                  placeholder="山田花子"
                  className={styles.field}
                  style={fieldStyle({
                    padding: "12px 14px",
                    fontSize: FONT_SIZE.input,
                    background: "#FFFCF8",
                    letterSpacing: "0.05em",
                  })}
                />
              </label>
              <div style={{ fontSize: FONT_SIZE.caption, color: "#B4A2A2", letterSpacing: "0.05em", marginTop: -8 }}>
                空欄の場合は宛名から自動で作られます
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: FONT_SIZE.label, letterSpacing: "0.1em", color: "#8C7676" }}>敬称</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(
                    [
                      { value: null, label: `既定(${cardConf.honor || "なし"})` },
                      { value: "様", label: "様" },
                      { value: "さん", label: "さん" },
                      { value: "", label: "なし" },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onSetHonor(value)}
                      className={styles.btnOutline}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        fontSize: FONT_SIZE.caption,
                        letterSpacing: "0.05em",
                        background: (draft.honor ?? null) === value ? "#D3A5B4" : "#FFFFFF",
                        color: (draft.honor ?? null) === value ? "#FFF9F5" : "#5C4A4A",
                        border:
                          (draft.honor ?? null) === value ? "1px solid #D3A5B4" : "1px solid #EBD9DF",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,252,248,0.7)",
                  border: "1px dashed #E3CBD4",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: FONT_SIZE.caption, color: "#8C7676", letterSpacing: "0.06em", lineHeight: 1.7 }}>
                  向き・デザイン・フォント・見出しはイベント共通の設定です
                </span>
                <button
                  type="button"
                  onClick={onOpenCardSettings}
                  className={styles.btnGhost}
                  style={{
                    alignSelf: "flex-start",
                    padding: "9px 18px",
                    borderRadius: 999,
                    border: "1px solid #D3A5B4",
                    background: "transparent",
                    color: "#B08A99",
                    fontSize: FONT_SIZE.label,
                    letterSpacing: "0.06em",
                  }}
                >
                  席札 / QRカードの設定を開く
                </button>
              </div>
            </>
          )}

          {showEscortFields && (
            <>
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
                卓番
                <input
                  value={draft.tableNo || ""}
                  onChange={(e) => onChangeTableNo(e.target.value)}
                  placeholder="A / 1 / さくら"
                  className={styles.field}
                  style={fieldStyle({
                    padding: "12px 14px",
                    fontSize: FONT_SIZE.input,
                    background: "#FFFCF8",
                    letterSpacing: "0.05em",
                  })}
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
                エスコートカードの名前
                <input
                  value={draft.escortName || ""}
                  onChange={(e) => onChangeEscortName(e.target.value)}
                  placeholder="Yamada Hanako"
                  className={styles.field}
                  style={fieldStyle({
                    padding: "12px 14px",
                    fontSize: FONT_SIZE.input,
                    background: "#FFFCF8",
                    letterSpacing: "0.05em",
                  })}
                />
              </label>
              <div style={{ fontSize: FONT_SIZE.caption, color: "#B4A2A2", letterSpacing: "0.05em", marginTop: -8 }}>
                空欄の場合は席札の名前・宛名から自動で作られます
              </div>
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
                一言(任意)
                <textarea
                  value={draft.escortMessage || ""}
                  onChange={(e) => onChangeEscortMessage(e.target.value)}
                  rows={2}
                  placeholder="今日はよろしくね"
                  className={styles.field}
                  style={fieldStyle({
                    padding: 12,
                    fontSize: FONT_SIZE.input,
                    lineHeight: 1.7,
                    letterSpacing: "0.04em",
                    resize: "vertical",
                    background: "#FFFCF8",
                  })}
                />
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: FONT_SIZE.label, letterSpacing: "0.1em", color: "#8C7676" }}>
                  写真(任意)
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {draft.escortPhoto && (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        backgroundImage: `url('${draft.escortPhoto}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        flex: "none",
                        boxShadow: "0 3px 10px rgba(150,110,130,0.18)",
                      }}
                    />
                  )}
                  <label
                    className={styles.btnOutline}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "9px 18px",
                      borderRadius: 999,
                      border: "1px solid #EBD9DF",
                      background: "#FFFFFF",
                      color: "#5C4A4A",
                      fontSize: FONT_SIZE.label,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    {draft.escortPhoto ? "写真を変更" : "写真を選ぶ"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUploadEscortPhoto(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {draft.escortPhoto && (
                    <button
                      type="button"
                      onClick={onRemoveEscortPhoto}
                      className={styles.btnGhost}
                      style={{
                        padding: "9px 14px",
                        borderRadius: 999,
                        border: "none",
                        background: "transparent",
                        color: "#B5555F",
                        fontSize: FONT_SIZE.label,
                        letterSpacing: "0.06em",
                      }}
                    >
                      削除
                    </button>
                  )}
                </div>
                <div style={{ fontSize: FONT_SIZE.overline, color: "#B4A2A2", letterSpacing: "0.05em" }}>
                  アップロード時に切り取り位置を選べます。やり直す場合は再度アップロードしてください。
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: FONT_SIZE.label, letterSpacing: "0.1em", color: "#8C7676" }}>敬称</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(
                    [
                      { value: null, label: `既定(${escortConf.honor || "なし"})` },
                      { value: "様", label: "様" },
                      { value: "さん", label: "さん" },
                      { value: "", label: "なし" },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onSetEscortHonor(value)}
                      className={styles.btnOutline}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        fontSize: FONT_SIZE.caption,
                        letterSpacing: "0.05em",
                        background: (draft.escortHonor ?? null) === value ? "#D3A5B4" : "#FFFFFF",
                        color: (draft.escortHonor ?? null) === value ? "#FFF9F5" : "#5C4A4A",
                        border:
                          (draft.escortHonor ?? null) === value ? "1px solid #D3A5B4" : "1px solid #EBD9DF",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,252,248,0.7)",
                  border: "1px dashed #E3CBD4",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: FONT_SIZE.caption, color: "#8C7676", letterSpacing: "0.06em", lineHeight: 1.7 }}>
                  スタイル・QR・フォント・見出しはイベント共通の設定です
                </span>
                <button
                  type="button"
                  onClick={onOpenEscortSettings}
                  className={styles.btnGhost}
                  style={{
                    alignSelf: "flex-start",
                    padding: "9px 18px",
                    borderRadius: 999,
                    border: "1px solid #D3A5B4",
                    background: "transparent",
                    color: "#B08A99",
                    fontSize: FONT_SIZE.label,
                    letterSpacing: "0.06em",
                  }}
                >
                  エスコートカードの設定を開く
                </button>
              </div>
            </>
          )}

          {showLetterFields && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: FONT_SIZE.label, letterSpacing: "0.1em", color: "#8C7676" }}>
                  お手紙の色
                </span>
                <div style={{ display: "flex", gap: 12 }}>
                  {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onSetTheme(k)}
                      aria-label={THEMES[k].label}
                      title={THEMES[k].label}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        cursor: "pointer",
                        background: `linear-gradient(135deg, ${THEMES[k].bg1} 40%, ${THEMES[k].accent} 130%)`,
                        border: (draft.theme || "rose") === k ? "3px solid #5C4A4A" : "3px solid #FFFFFF",
                        boxShadow: "0 3px 10px rgba(150,110,130,0.18)",
                      }}
                    />
                  ))}
                </div>
              </div>
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
                本文
                <textarea
                  value={draft.body || ""}
                  onChange={(e) => onChangeBody(e.target.value)}
                  rows={12}
                  placeholder="今日は来てくれてありがとう…"
                  className={styles.field}
                  style={fieldStyle({
                    padding: 14,
                    fontSize: FONT_SIZE.input,
                    lineHeight: 1.9,
                    letterSpacing: "0.04em",
                    resize: "vertical",
                    fontFamily: pFont,
                    background: "#FFFCF8",
                  })}
                />
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: FONT_SIZE.label, letterSpacing: "0.1em", color: "#8C7676" }}>
                  写真(本文のあとに1枚)
                </span>
                <div
                  style={{
                    background: "rgba(255,252,248,0.55)",
                    border: "1px dashed #E3CBD4",
                    borderRadius: 14,
                    padding: "14px 18px",
                    color: "#B4A2A2",
                    maxWidth: 260,
                  }}
                >
                  <div style={{ fontSize: FONT_SIZE.bodySm, letterSpacing: "0.08em" }}>Coming soon</div>
                </div>
              </div>
            </>
          )}

        </div>

        <div style={{ flex: 1.2, minWidth: 300, position: "sticky", top: 20 }}>
          <div style={{ fontSize: FONT_SIZE.label, letterSpacing: "0.14em", color: "#8C7676", marginBottom: 10 }}>
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
              <p style={{ margin: "10px 0 0", fontSize: FONT_SIZE.caption, color: "#B4A2A2", letterSpacing: "0.05em", textAlign: "center" }}>
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
              <p style={{ margin: "10px 0 0", fontSize: FONT_SIZE.caption, color: "#B4A2A2", letterSpacing: "0.05em", textAlign: "center" }}>
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
          background: "#FFFCF8",
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
              border: "1px solid #EBD9DF",
              background: "#FFFFFF",
              color: "#5C4A4A",
              fontSize: FONT_SIZE.body,
              letterSpacing: "0.08em",
            }}
          >
            <Eye size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none", color: "#B08A99" }} />
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
              background: "#D3A5B4",
              color: "#FFF9F5",
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
              border: "1px solid #EBD9DF",
              background: "#FFFFFF",
              color: "#5C4A4A",
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
              color: "#B4A2A2",
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
