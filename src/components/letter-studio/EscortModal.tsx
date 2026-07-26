"use client";

import type { MouseEvent, RefObject } from "react";
import { Download, Printer } from "lucide-react";
import { EscortCardFace } from "./EscortCardFace";
import type { EscortGeometry } from "./geometry";
import type { EscortStyle } from "./types";

interface EscortModalProps {
  style: EscortStyle;
  geometry: EscortGeometry;
  paper: string;
  accent: string;
  gold: string;
  ink: string;
  inkSoft: string;
  font: string;
  name: string;
  tableNo: string;
  tableLabel: string;
  heading: string;
  message: string;
  photo: string;
  footText: string;
  showQr: boolean;
  qrUrl: string;
  cardRef: RefObject<HTMLDivElement | null>;
  onSaveImage: () => void;
  onPrint: () => void;
  onClose: () => void;
}

function modalCardWidth(style: EscortStyle): string {
  return style === "card" ? "min(300px,74vw)" : "min(560px,90vw)";
}

export function EscortModal({
  style,
  geometry: g,
  paper,
  accent,
  gold,
  ink,
  inkSoft,
  font,
  name,
  tableNo,
  tableLabel,
  heading,
  message,
  photo,
  footText,
  showQr,
  qrUrl,
  cardRef,
  onSaveImage,
  onPrint,
  onClose,
}: EscortModalProps) {
  const stop = (e: MouseEvent) => e.stopPropagation();

  const actionStyle = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 20px",
    borderRadius: 999,
    border: "none",
    background: "rgba(255,249,245,0.9)",
    color: "#5C4A4A",
    fontSize: 12.5,
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
        <EscortCardFace
          ref={cardRef}
          style={style}
          width={modalCardWidth(style)}
          aspect={g.aspect}
          paper={paper}
          accent={accent}
          gold={gold}
          ink={ink}
          inkSoft={inkSoft}
          font={font}
          name={name}
          tableNo={tableNo}
          tableLabel={tableLabel}
          heading={heading}
          message={message}
          photo={photo}
          footText={footText}
          showQr={showQr}
          qrUrl={qrUrl}
          boxShadow="0 22px 60px rgba(0,0,0,0.3)"
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" onClick={onSaveImage} style={actionStyle}>
            <Download size={13} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
            画像として保存
          </button>
          <button type="button" onClick={onPrint} style={actionStyle}>
            <Printer size={13} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
            印刷する
          </button>
          <button type="button" onClick={onClose} style={actionStyle}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
