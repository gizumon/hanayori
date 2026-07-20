"use client";

import type { RefObject } from "react";
import { FONTS, THEMES } from "../constants";
import { FontOptionRow, PillButton, fieldStyle } from "../controls";
import { QrCardFace } from "../QrCardFace";
import type { CardGeometry } from "../geometry";
import styles from "../letter-studio.module.css";
import type { CardConfig, CardFrame, CardOrient, Draft, FontKey, Honor, Project } from "../types";

interface CardScreenProps {
  project: Project;
  draft: Draft;
  cardConf: CardConfig;
  geometry: CardGeometry;
  cardName: string;
  qrUrl: string;
  cardRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onSetOrient: (orient: CardOrient) => void;
  onSetFrame: (frame: CardFrame) => void;
  onSetHonor: (honor: Honor) => void;
  onSetCardFont: (font: FontKey) => void;
  onChangeHeading: (v: string) => void;
  onChangeNote: (v: string) => void;
  onSave: () => void;
  onPrint: () => void;
}

const ORIENT_OPTS: { key: CardOrient; label: string }[] = [
  { key: "landscape", label: "横(91×55)" },
  { key: "portrait", label: "縦(55×91)" },
  { key: "tent-l", label: "二つ折り 横(91×110)" },
  { key: "tent-p", label: "二つ折り 縦(110×91)" },
];

const FRAME_OPTS: { key: CardFrame; label: string }[] = [
  { key: "line", label: "ライン" },
  { key: "frame", label: "フレーム" },
  { key: "minimal", label: "ミニマル" },
];

const HONOR_OPTS: { key: Honor; label: string }[] = [
  { key: "様", label: "様" },
  { key: "さん", label: "さん" },
  { key: "なし", label: "なし" },
];

export function CardScreen({
  project,
  draft,
  cardConf,
  geometry: g,
  cardName,
  qrUrl,
  cardRef,
  onBack,
  onSetOrient,
  onSetFrame,
  onSetHonor,
  onSetCardFont,
  onChangeHeading,
  onChangeNote,
  onSave,
  onPrint,
}: CardScreenProps) {
  const theme = THEMES[draft.theme || "rose"];
  const cFont = FONTS[project.cardFont || "mincho"].family;

  return (
    <main
      className={styles.fadeup}
      style={{ maxWidth: 1060, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 80px" }}
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
        ← お手紙の編集にもどる
      </button>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, letterSpacing: "0.14em" }}>
        席札 × QRカード
      </h2>
      <p style={{ margin: "0 0 26px", fontSize: 12.5, color: "#8C7676", letterSpacing: "0.06em" }}>
        席札としてテーブルに置けます。QRを読み取ると、その方宛のお手紙が開きます。
        <br />
        デザインは「{project.name}」の全カード共通です。
      </p>
      <div style={{ display: "flex", gap: 36, alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flex: 1.4, minWidth: 300 }}>
          <QrCardFace
            ref={cardRef}
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
            footText={project.name + (!project.noDate && project.date ? ` ・ ${project.date}` : "")}
            qrUrl={qrUrl}
            boxShadow="0 18px 50px rgba(150,110,130,0.25)"
          />
          <p style={{ margin: 0, fontSize: 11.5, color: "#B4A2A2", letterSpacing: "0.05em" }}>
            印刷は実寸 {g.sizeLabel} で出力されます
          </p>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 280,
            maxWidth: 380,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            background: "#FFFCF8",
            borderRadius: 16,
            padding: "24px 22px",
            boxShadow: "0 8px 28px rgba(150,110,130,0.14)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: "0.14em", color: "#8C7676" }}>
            カードのカスタマイズ
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.1em", color: "#8C7676" }}>向き</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ORIENT_OPTS.map((o) => (
                <PillButton
                  key={o.key}
                  label={o.label}
                  active={cardConf.orient === o.key}
                  onClick={() => onSetOrient(o.key)}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.1em", color: "#8C7676" }}>デザイン</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FRAME_OPTS.map((o) => (
                <PillButton
                  key={o.key}
                  label={o.label}
                  active={cardConf.frame === o.key}
                  onClick={() => onSetFrame(o.key)}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.1em", color: "#8C7676" }}>敬称</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {HONOR_OPTS.map((o) => (
                <PillButton
                  key={o.key}
                  label={o.label}
                  active={cardConf.honor === o.key}
                  onClick={() => onSetHonor(o.key)}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.1em", color: "#8C7676" }}>席札のフォント</span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                border: "1px solid #EBD9DF",
                borderRadius: 12,
                overflow: "hidden",
                background: "#FFFFFF",
              }}
            >
              {(Object.keys(FONTS) as FontKey[]).map((k) => (
                <FontOptionRow
                  key={k}
                  label={FONTS[k].label}
                  family={FONTS[k].family}
                  sample="さくら 様"
                  active={(project.cardFont || "mincho") === k}
                  onClick={() => onSetCardFont(k)}
                  compact
                />
              ))}
            </div>
          </div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 12,
              letterSpacing: "0.1em",
              color: "#8C7676",
            }}
          >
            見出し
            <input
              value={cardConf.heading}
              onChange={(e) => onChangeHeading(e.target.value)}
              placeholder="WEDDING RECEPTION"
              className={styles.field}
              style={fieldStyle()}
            />
          </label>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 12,
              letterSpacing: "0.1em",
              color: "#8C7676",
            }}
          >
            案内文
            <textarea
              value={cardConf.note}
              onChange={(e) => onChangeNote(e.target.value)}
              rows={2}
              className={styles.field}
              style={fieldStyle({ fontSize: 13.5, lineHeight: 1.7, resize: "vertical" })}
            />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <button
              type="button"
              onClick={onSave}
              className={styles.btnSolid}
              style={{
                padding: "11px 20px",
                borderRadius: 999,
                border: "none",
                background: "#D3A5B4",
                color: "#FFF9F5",
                fontSize: 13,
                letterSpacing: "0.06em",
                boxShadow: "0 6px 16px rgba(150,110,130,0.28)",
              }}
            >
              画像として保存
            </button>
            <button
              type="button"
              onClick={onPrint}
              className={styles.btnOutline}
              style={{
                padding: "11px 20px",
                borderRadius: 999,
                border: "1px solid #EBD9DF",
                background: "#FFFFFF",
                color: "#5C4A4A",
                fontSize: 13,
                letterSpacing: "0.06em",
              }}
            >
              印刷する
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
