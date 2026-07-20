"use client";

import { forwardRef } from "react";
import { QrCode } from "./QrCode";
import type { CardGeometry } from "./geometry";
import type { CardFrame } from "./types";

interface QrCardFaceProps {
  width: string;
  aspect: string;
  paper: string;
  accent: string;
  gold: string;
  ink: string;
  inkSoft: string;
  font: string;
  frame: CardFrame;
  geometry: CardGeometry;
  cardName: string;
  heading: string;
  note: string;
  footText: string;
  qrUrl: string;
  boxShadow: string;
}

export const QrCardFace = forwardRef<HTMLDivElement, QrCardFaceProps>(
  function QrCardFace(
    {
      width,
      aspect,
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
      boxShadow,
    },
    ref
  ) {
    const barDisplay = frame === "line" ? "block" : "none";
    const frameDisplay = frame === "frame" ? "block" : "none";

    return (
      <div
        ref={ref}
        style={{
          width,
          aspectRatio: aspect,
          background: paper,
          boxShadow,
          fontFamily: font,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: g.barW,
            height: g.barH,
            background: accent,
            display: barDisplay,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 9,
            border: `1px solid ${accent}`,
            pointerEvents: "none",
            opacity: 0.65,
            display: frameDisplay,
          }}
        />
        {g.isTent ? (
          <>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: g.foldInset,
                borderTop: g.foldBT,
                borderLeft: g.foldBL,
                opacity: 0.6,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: g.namePanelInset,
                transform: `rotate(${g.namePanelRotate})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                textAlign: "center",
                padding: "5%",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(9px,1.9vw,11px)",
                  letterSpacing: "0.3em",
                  color: inkSoft,
                }}
              >
                {heading}
              </div>
              <div
                style={{
                  fontSize: "clamp(22px,5.6vw,32px)",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: ink,
                  lineHeight: 1.3,
                }}
              >
                {cardName}
              </div>
              <div
                style={{
                  fontSize: "clamp(8px,1.6vw,10px)",
                  letterSpacing: "0.12em",
                  color: inkSoft,
                  marginTop: 4,
                }}
              >
                {footText}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                inset: g.qrPanelInset,
                transform: `rotate(${g.qrPanelRotate})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "5%",
              }}
            >
              <div
                style={{
                  width: "min(46%,120px)",
                  aspectRatio: 1,
                  background: "#FFFFFF",
                  borderRadius: 12,
                  padding: 8,
                  boxShadow: "0 4px 14px rgba(150,110,130,0.16)",
                }}
              >
                <QrCode url={qrUrl} color={ink} />
              </div>
              <div
                style={{
                  fontSize: "clamp(8px,1.7vw,10px)",
                  letterSpacing: "0.1em",
                  color: inkSoft,
                  textAlign: "center",
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                }}
              >
                {note}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: 16,
                top: 14,
                display: "flex",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 9,
                  background: gold,
                  borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                  opacity: 0.8,
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 8,
                  background: gold,
                  borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                  transform: "rotate(40deg)",
                  opacity: 0.55,
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                inset: g.contentInset,
                display: "flex",
                flexDirection: g.flexDir,
                padding: "4%",
              }}
            >
              <div
                style={{
                  flex: 1.4,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 6,
                  padding: g.namePad,
                  alignItems: g.nameAlign,
                  textAlign: g.textAlign,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(9px,1.9vw,11px)",
                    letterSpacing: "0.3em",
                    color: inkSoft,
                  }}
                >
                  {heading}
                </div>
                <div
                  style={{
                    fontSize: "clamp(22px,5.6vw,32px)",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    color: ink,
                    lineHeight: 1.3,
                  }}
                >
                  {cardName}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "3%",
                }}
              >
                <div
                  style={{
                    width: "min(58%,116px)",
                    aspectRatio: 1,
                    background: "#FFFFFF",
                    borderRadius: 12,
                    padding: 8,
                    boxShadow: "0 4px 14px rgba(150,110,130,0.16)",
                  }}
                >
                  <QrCode url={qrUrl} color={ink} />
                </div>
                <div
                  style={{
                    fontSize: "clamp(8px,1.7vw,10px)",
                    letterSpacing: "0.1em",
                    color: inkSoft,
                    textAlign: "center",
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}
                >
                  {note}
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: g.footLeft,
                right: g.footRight,
                bottom: "5.5%",
                fontSize: "clamp(8.5px,1.8vw,10.5px)",
                letterSpacing: "0.12em",
                color: inkSoft,
                textAlign: g.textAlign,
              }}
            >
              {footText}
            </div>
          </>
        )}
      </div>
    );
  }
);
