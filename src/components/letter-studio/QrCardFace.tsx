"use client";

import { forwardRef } from "react";
import { QrCode } from "./QrCode";
import { cardUnit, type CardGeometry } from "./geometry";
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
  /** 日付。footText の下に改行して小さく表示する。 */
  date: string;
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
      date,
      qrUrl,
      boxShadow,
    },
    ref
  ) {
    const barDisplay = frame === "line" ? "block" : "none";
    const frameDisplay = frame === "frame" ? "block" : "none";
    // カード内の寸法はすべてカード幅基準(cqw)。プレビューの幅がいくつでも、
    // 印刷用の 640px オフスクリーンでも、同じ縮尺の相似形で描かれる。
    const u = cardUnit(g.refW);

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
          containerType: "inline-size",
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
            inset: u(9),
            border: `${u(1)} solid ${accent}`,
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
                gap: u(6),
                textAlign: "center",
                padding: "5%",
              }}
            >
              <div
                style={{
                  fontSize: u(11),
                  letterSpacing: "0.3em",
                  color: inkSoft,
                }}
              >
                {heading}
              </div>
              <div
                style={{
                  fontSize: u(32),
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
                  fontSize: u(10),
                  letterSpacing: "0.12em",
                  color: inkSoft,
                  marginTop: u(4),
                }}
              >
                {footText}
              </div>
              {date && (
                <div
                  style={{
                    fontSize: u(8.5),
                    letterSpacing: "0.1em",
                    color: inkSoft,
                    marginTop: u(2),
                  }}
                >
                  {date}
                </div>
              )}
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
                gap: u(8),
                padding: "5%",
              }}
            >
              <div
                style={{
                  width: `min(46%,${u(120)})`,
                  aspectRatio: 1,
                  background: "#FFFFFF",
                  borderRadius: u(12),
                  padding: u(8),
                  boxShadow: `0 ${u(4)} ${u(14)} rgba(150,110,130,0.16)`,
                }}
              >
                <QrCode url={qrUrl} color={ink} />
              </div>
              <div
                style={{
                  fontSize: u(10),
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
                right: u(16),
                top: u(14),
                display: "flex",
                gap: u(5),
              }}
            >
              <span
                style={{
                  width: u(7),
                  height: u(9),
                  background: gold,
                  borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                  opacity: 0.8,
                }}
              />
              <span
                style={{
                  width: u(6),
                  height: u(8),
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
                  gap: u(6),
                  padding: g.namePad,
                  alignItems: g.nameAlign,
                  textAlign: g.textAlign,
                }}
              >
                <div
                  style={{
                    fontSize: u(11),
                    letterSpacing: "0.3em",
                    color: inkSoft,
                  }}
                >
                  {heading}
                </div>
                <div
                  style={{
                    fontSize: u(32),
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
                  gap: u(7),
                  padding: "3%",
                }}
              >
                <div
                  style={{
                    width: `min(58%,${u(116)})`,
                    aspectRatio: 1,
                    background: "#FFFFFF",
                    borderRadius: u(12),
                    padding: u(8),
                    boxShadow: `0 ${u(4)} ${u(14)} rgba(150,110,130,0.16)`,
                  }}
                >
                  <QrCode url={qrUrl} color={ink} />
                </div>
                <div
                  style={{
                    fontSize: u(10),
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
                color: inkSoft,
                textAlign: g.textAlign,
              }}
            >
              <div style={{ fontSize: u(10.5), letterSpacing: "0.12em" }}>
                {footText}
              </div>
              {date && (
                <div
                  style={{
                    fontSize: u(8.5),
                    letterSpacing: "0.1em",
                    marginTop: u(2),
                  }}
                >
                  {date}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
);
