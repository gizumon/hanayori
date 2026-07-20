"use client";

import type { MouseEvent } from "react";
import { QrCardFace } from "./QrCardFace";
import type { CardGeometry } from "./geometry";
import type { CardConfig } from "./types";

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
  qrUrl: string;
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
  qrUrl,
  onClose,
}: QrModalProps) {
  const stop = (e: MouseEvent) => e.stopPropagation();

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
          qrUrl={qrUrl}
          boxShadow="0 22px 60px rgba(0,0,0,0.3)"
        />
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "9px 22px",
            borderRadius: 999,
            border: "none",
            background: "rgba(255,249,245,0.9)",
            color: "#5C4A4A",
            fontSize: 12.5,
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
