"use client";

import { forwardRef } from "react";
import { withAlpha } from "@/lib/color";
import { cardUnit, escortGeom } from "./geometry";
import type { EscortStyle } from "./types";

interface EscortCardFaceProps {
  style: EscortStyle;
  width: string;
  aspect: string;
  paper: string;
  accent: string;
  gold: string;
  ink: string;
  inkSoft: string;
  font: string;
  /** 敬称適用済みの表示名 */
  name: string;
  tableNo: string;
  tableLabel: string;
  heading: string;
  message: string;
  /** 切り取り済み写真の dataUrl。空文字/未指定なら非表示。 */
  photo: string;
  footText: string;
  boxShadow: string;
}

/** 中央に小さな飾り(ゴールドのリーフ)を挟んだ罫線 */
function OrnamentRule({
  gold,
  width = "70%",
  u,
}: {
  gold: string;
  width?: string;
  u: (px: number) => string;
}) {
  return (
    <div
      aria-hidden="true"
      style={{ display: "flex", alignItems: "center", gap: u(8), width, margin: "0 auto" }}
    >
      <span style={{ flex: 1, height: u(1), background: withAlpha(gold, 55) }} />
      <span
        style={{
          width: u(5),
          height: u(7),
          background: gold,
          borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
          opacity: 0.85,
          flex: "none",
        }}
      />
      <span style={{ flex: 1, height: u(1), background: withAlpha(gold, 55) }} />
    </div>
  );
}

export const EscortCardFace = forwardRef<HTMLDivElement, EscortCardFaceProps>(
  function EscortCardFace(
    {
      style,
      width,
      aspect,
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
      boxShadow,
    },
    ref
  ) {
    const table = tableNo || "—";
    // カード内の寸法はすべてカード幅基準(cqw)。プレビューの幅がいくつでも、
    // 印刷用の 640px オフスクリーンでも、同じ縮尺の相似形で描かれる。
    const u = cardUnit(escortGeom(style).refW);

    if (style === "card") {
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
          {/* 二重の細フレーム */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: u(8),
              border: `${u(1)} solid ${withAlpha(accent, 40)}`,
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: u(11),
              border: `${u(1)} solid ${withAlpha(accent, 18)}`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: u(11),
              left: u(11),
              right: u(11),
              bottom: u(11),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2.5%",
              padding: "9% 10% 0",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: u(12),
                letterSpacing: "0.34em",
                textIndent: "0.34em",
                color: inkSoft,
                textTransform: "uppercase",
              }}
            >
              {tableLabel}
            </div>
            <div
              style={{
                fontSize: u(84),
                fontWeight: 500,
                lineHeight: 1.05,
                color: ink,
              }}
            >
              {table}
            </div>
            <OrnamentRule gold={gold} width="56%" u={u} />
            {photo && (
              <div
                style={{
                  width: "40%",
                  aspectRatio: 1,
                  borderRadius: "50%",
                  backgroundImage: `url('${photo}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: `${u(2)} solid ${paper}`,
                  outline: `${u(1)} solid ${withAlpha(gold, 60)}`,
                  boxShadow: `0 ${u(4)} ${u(14)} rgba(150,110,130,0.22)`,
                  margin: "2% 0",
                }}
              />
            )}
            <div
              style={{
                fontSize: u(28),
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: ink,
                lineHeight: 1.35,
              }}
            >
              {name}
            </div>
            {message && (
              <div
                style={{
                  fontSize: u(11.5),
                  letterSpacing: "0.06em",
                  color: inkSoft,
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                  marginTop: "1%",
                }}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ticket 風
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
          display: "flex",
          containerType: "inline-size",
        }}
      >
        {/* 全体の細フレーム(点線ミシン目が上に重なる) */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: u(7),
            border: `${u(1)} solid ${withAlpha(accent, 35)}`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        {/* 半券より左側(写真+本体+日付フッター) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, display: "flex", minWidth: 0 }}>
            {photo && (
              <div
                style={{
                  width: "31%",
                  flex: "none",
                  backgroundImage: `url('${photo}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}
            {/* 本体(ミシン目の内側) */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                padding: photo ? "5% 3% 0 4%" : "5% 3% 0 5%",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "3.5%",
                }}
              >
                <div
                  style={{
                    fontSize: u(10.5),
                    letterSpacing: "0.3em",
                    color: inkSoft,
                    textTransform: "uppercase",
                  }}
                >
                  {heading}
                </div>
                {footText && (
                  <div
                    style={{
                      fontSize: u(9.5),
                      letterSpacing: "0.16em",
                      color: withAlpha(inkSoft, 85),
                    }}
                  >
                    {footText}
                  </div>
                )}
                {/* 全角10文字 / 半角20文字が1行に収まるサイズ */}
                <div
                  style={{
                    fontSize: u(20),
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: ink,
                    lineHeight: 1.2,
                    margin: "3.5% 0",
                    overflowWrap: "anywhere",
                  }}
                >
                  {name}
                </div>
                <div
                  aria-hidden="true"
                  style={{ width: "38%", height: u(1), background: withAlpha(gold, 60) }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: u(24),
                    marginTop: "1.5%",
                  }}
                >
                  <span
                    style={{
                      fontSize: u(12.5),
                      letterSpacing: "0.22em",
                      color: inkSoft,
                      textTransform: "uppercase",
                    }}
                  >
                    {tableLabel}
                  </span>
                  <span
                    style={{
                      fontSize: u(42),
                      fontWeight: 700,
                      lineHeight: 1,
                      color: ink,
                    }}
                  >
                    {table}
                  </span>
                </div>
                {message && (
                  <div
                    style={{
                      fontSize: u(10.5),
                      letterSpacing: "0.05em",
                      color: inkSoft,
                      lineHeight: 1.7,
                      whiteSpace: "pre-line",
                      marginTop: "2.5%",
                    }}
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* 半券(stub) 45mm / 全体182mm */}
        <div
          style={{
            width: "24.73%",
            flex: "none",
            borderLeft: `${u(1.5)} dashed ${withAlpha(accent, 80)}`,
            background: withAlpha(accent, 8),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "9%",
            padding: "6% 3.5%",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: u(9),
              letterSpacing: "0.26em",
              textIndent: "0.26em",
              color: inkSoft,
              textTransform: "uppercase",
            }}
          >
            {tableLabel}
          </div>
          <div
            style={{
              fontSize: u(36),
              fontWeight: 700,
              lineHeight: 1,
              color: ink,
            }}
          >
            {table}
          </div>
          <OrnamentRule gold={gold} width="64%" u={u} />
          {/* 全角5文字 / 半角10文字が1行に収まるサイズ */}
          <div
            style={{
              fontSize: u(10.5),
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: ink,
              lineHeight: 1.45,
              overflowWrap: "anywhere",
            }}
          >
            {name}
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "26.7%",
            top: "9%",
            display: "flex",
            gap: u(4),
            zIndex: 1,
          }}
        >
          <span
            style={{
              width: u(6),
              height: u(8),
              background: gold,
              borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
              opacity: 0.75,
            }}
          />
          <span
            style={{
              width: u(5),
              height: u(7),
              background: gold,
              borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
              transform: "rotate(40deg)",
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    );
  }
);
