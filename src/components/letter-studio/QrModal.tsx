"use client";

import type { MouseEvent, RefObject } from "react";
import { Download } from "lucide-react";
import { QrCardFace } from "./QrCardFace";
import type { CardGeometry } from "./geometry";
import type { CardConfig } from "./types";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface QrModalProps {
  paper: string;
  accent: string;
  gold: string;
  ink: string;
  inkSoft: string;
  font: string;
  frame: CardConfig["frame"];
  geometry: CardGeometry;
  cardName: string;
  heading: string;
  note: string;
  footText: string;
  date: string;
  qrUrl: string;
  cardRef: RefObject<HTMLDivElement | null>;
  onSaveImage: () => void;
  onClose: () => void;
}

function modalCardWidth(g: CardGeometry): string {
  if (g.aspect === "91 / 110") return "min(340px,80vw)";
  if (g.aspect === "110 / 91") return "min(420px,88vw)";
  if (g.flexDir === "row") return "min(480px,88vw)";
  return "min(300px,72vw)";
}

export function QrModal({
  paper,
  accent,
  gold,
  ink,
  inkSoft,
  font,
  frame,
  geometry: g,
  cardName,
  heading,
  note,
  footText,
  date,
  qrUrl,
  cardRef,
  onSaveImage,
  onClose,
}: QrModalProps) {
  useScrollLock();
  const stop = (e: MouseEvent) => e.stopPropagation();

  const actionStyle = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 20px",
    borderRadius: 999,
    border: "none",
    background: "rgba(255,249,245,0.9)",
    color: COLOR.ink,
    fontSize: FONT_SIZE.label,
    letterSpacing: "0.06em",
    cursor: "pointer",
  } as const;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 65,
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
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
      >
        <QrCardFace
          ref={cardRef}
          width={modalCardWidth(g)}
          aspect={g.aspect}
          paper={paper}
          accent={accent}
          gold={gold}
          ink={ink}
          inkSoft={inkSoft}
          font={font}
          frame={frame}
          geometry={g}
          cardName={cardName}
          heading={heading}
          note={note}
          footText={footText}
          date={date}
          qrUrl={qrUrl}
          boxShadow="0 22px 60px rgba(0,0,0,0.3)"
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" onClick={onSaveImage} style={actionStyle}>
            <Download size={13} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
            画像として保存
          </button>
          <button type="button" onClick={onClose} style={actionStyle}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
