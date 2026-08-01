"use client";

import { forwardRef } from "react";
import { withAlpha } from "@/lib/color";
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
function OrnamentRule({ gold, width = "70%" }: { gold: string; width?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ display: "flex", alignItems: "center", gap: 8, width, margin: "0 auto" }}
    >
      <span style={{ flex: 1, height: 1, background: withAlpha(gold, 55) }} />
      <span
        style={{
          width: 5,
          height: 7,
          background: gold,
          borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
          opacity: 0.85,
          flex: "none",
        }}
      />
      <span style={{ flex: 1, height: 1, background: withAlpha(gold, 55) }} />
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
          }}
        >
          {/* 二重の細フレーム */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 8,
              border: `1px solid ${withAlpha(accent, 40)}`,
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 11,
              border: `1px solid ${withAlpha(accent, 18)}`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 11,
              left: 11,
              right: 11,
              bottom: 11,
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
                fontSize: "clamp(9px,3vw,12px)",
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
                fontSize: "clamp(48px,19vw,84px)",
                fontWeight: 500,
                lineHeight: 1.05,
                color: ink,
              }}
            >
              {table}
            </div>
            <OrnamentRule gold={gold} width="56%" />
            {photo && (
              <div
                style={{
                  width: "40%",
                  aspectRatio: 1,
                  borderRadius: "50%",
                  backgroundImage: `url('${photo}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: `2px solid ${paper}`,
                  outline: `1px solid ${withAlpha(gold, 60)}`,
                  boxShadow: "0 4px 14px rgba(150,110,130,0.22)",
                  margin: "2% 0",
                }}
              />
            )}
            <div
              style={{
                fontSize: "clamp(18px,6.6vw,28px)",
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
                  fontSize: "clamp(9px,2.9vw,11.5px)",
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
        }}
      >
        {/* 全体の細フレーム(点線ミシン目が上に重なる) */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 7,
            border: `1px solid ${withAlpha(accent, 35)}`,
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
                    fontSize: "clamp(8px,1.9vw,10.5px)",
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
                      fontSize: "clamp(7.5px,1.7vw,9.5px)",
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
                    fontSize: "clamp(13px,3.2vw,20px)",
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
                  style={{ width: "38%", height: 1, background: withAlpha(gold, 60) }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "clamp(12px,3vw,24px)",
                    marginTop: "1.5%",
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(9px,2.1vw,12.5px)",
                      letterSpacing: "0.22em",
                      color: inkSoft,
                      textTransform: "uppercase",
                    }}
                  >
                    {tableLabel}
                  </span>
                  <span
                    style={{
                      fontSize: "clamp(25px,7.6vw,42px)",
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
                      fontSize: "clamp(8px,1.8vw,10.5px)",
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
            borderLeft: `1.5px dashed ${withAlpha(accent, 80)}`,
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
              fontSize: "clamp(7px,1.6vw,9px)",
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
              fontSize: "clamp(22px,6vw,36px)",
              fontWeight: 700,
              lineHeight: 1,
              color: ink,
            }}
          >
            {table}
          </div>
          <OrnamentRule gold={gold} width="64%" />
          {/* 全角5文字 / 半角10文字が1行に収まるサイズ */}
          <div
            style={{
              fontSize: "clamp(7.5px,1.6vw,10.5px)",
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
            gap: 4,
            zIndex: 1,
          }}
        >
          <span
            style={{
              width: 6,
              height: 8,
              background: gold,
              borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
              opacity: 0.75,
            }}
          />
          <span
            style={{
              width: 5,
              height: 7,
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
