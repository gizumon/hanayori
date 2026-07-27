"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { X } from "lucide-react";
import { FONTS, THEMES } from "./constants";
import { QrCardFace } from "./QrCardFace";
import { EscortCardFace } from "./EscortCardFace";
import { LetterPreviewFace } from "./LetterPreviewFace";
import type { CardGeometry, EscortGeometry } from "./geometry";
import type { CardConfig, Draft, EditorTab, EscortConfig, Project } from "./types";
import { FONT_SIZE } from "@/lib/typography";

interface LetterPreviewModalProps {
  project: Project;
  draft: Draft;
  cardConf: CardConfig;
  escortConf: EscortConfig;
  geometry: CardGeometry;
  escortGeometry: EscortGeometry;
  cardName: string;
  escortName: string;
  qrUrl: string;
  initialTab: EditorTab;
  onClose: () => void;
}

function modalCardWidth(g: CardGeometry): string {
  if (g.aspect === "91 / 110") return "min(340px,80vw)";
  if (g.aspect === "110 / 91") return "min(420px,88vw)";
  if (g.flexDir === "row") return "min(480px,88vw)";
  return "min(300px,72vw)";
}

function modalEscortWidth(style: EscortConfig["style"]): string {
  return style === "card" ? "min(300px,74vw)" : "min(560px,90vw)";
}

/**
 * 編集中のお手紙(未保存でも可)を、お手紙 / 席札 / エスコートカードのタブ切り替えで
 * まとめて見返せるポップアップ。QrModal/EscortModal と違い保存前提の実物確認用なので、
 * 画像保存や印刷などの出力操作は持たない。
 */
export function LetterPreviewModal({
  project,
  draft,
  cardConf,
  escortConf,
  geometry: g,
  escortGeometry: eg,
  cardName,
  escortName,
  qrUrl,
  initialTab,
  onClose,
}: LetterPreviewModalProps) {
  const cardEnabled = cardConf.enabled;
  const escortEnabled = escortConf.enabled;
  const [tab, setTab] = useState<EditorTab>(initialTab);

  const theme = THEMES[draft.theme || "rose"];
  const pFont = FONTS[project.letterConfig.font].family;
  const cFont = FONTS[cardConf.font].family;
  const eFont = FONTS[escortConf.font].family;
  const footText = cardConf.nameOverride.trim() || project.name;
  const escortFootText = escortConf.nameOverride.trim() || project.name;

  const stop = (e: MouseEvent) => e.stopPropagation();

  const tabs: { key: EditorTab; label: string }[] = [
    { key: "letter", label: "お手紙" },
    ...(cardEnabled ? [{ key: "card" as const, label: "席札" }] : []),
    ...(escortEnabled ? [{ key: "escort" as const, label: "エスコート" }] : []),
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(60,42,46,0.5)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={stop}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          maxWidth: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {tabs.length > 1 && (
            <div style={{ display: "flex", gap: 4, background: "rgba(255,249,245,0.9)", borderRadius: 999, padding: 4 }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontSize: FONT_SIZE.bodySm,
                    letterSpacing: "0.08em",
                    background: tab === t.key ? "#D3A5B4" : "transparent",
                    color: tab === t.key ? "#FFF9F5" : "#5C4A4A",
                    fontWeight: tab === t.key ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            style={{
              flex: "none",
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,249,245,0.9)",
              color: "#5C4A4A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        {tab === "letter" && (
          <div style={{ width: "min(380px,88vw)" }}>
            <LetterPreviewFace
              to={draft.to || ""}
              body={draft.body || ""}
              photo={draft.photo}
              photoRatio={draft.photoRatio}
              date={project.date}
              font={pFont}
              theme={theme}
            />
          </div>
        )}

        {tab === "card" && cardEnabled && (
          <QrCardFace
            width={modalCardWidth(g)}
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
            boxShadow="0 22px 60px rgba(0,0,0,0.3)"
          />
        )}

        {tab === "escort" && escortEnabled && (
          <EscortCardFace
            style={escortConf.style}
            width={modalEscortWidth(escortConf.style)}
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
            footText={escortFootText}
            boxShadow="0 22px 60px rgba(0,0,0,0.3)"
          />
        )}
      </div>
    </div>
  );
}
