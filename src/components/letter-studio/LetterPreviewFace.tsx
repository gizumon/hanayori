"use client";

import { Lock } from "lucide-react";
import { HIDDEN_BODY_FILLER, HIDDEN_BODY_NOTE } from "./constants";
import { withAlpha } from "@/lib/color";
import { FONT_SIZE } from "@/lib/typography";

interface LetterPreviewTheme {
  bg1: string;
  g1: string;
  g2: string;
  paper: string;
  accent: string;
  gold: string;
  ink: string;
  inkSoft: string;
}

interface LetterPreviewFaceProps {
  to: string;
  body: string;
  photo?: string | null;
  photoRatio?: number;
  date: string | null;
  font: string;
  theme: LetterPreviewTheme;
  padding?: string;
  /**
   * 他のメンバーが「見せない」に設定したお手紙。本文の位置だけをぼかしで塞ぐ
   * (宛名・日付・便箋の意匠はそのまま)。写真も届いていないので出さない。
   */
  hiddenBody?: boolean;
}

/** お手紙本体のビジュアル(便箋風のカード)。編集画面のサイドプレビューとプレビューポップアップで共用する。 */
export function LetterPreviewFace({
  to,
  body,
  photo,
  photoRatio,
  date,
  font,
  theme,
  padding,
  hiddenBody,
}: LetterPreviewFaceProps) {
  const bodyStyle = {
    fontFamily: font,
    fontSize: FONT_SIZE.body,
    lineHeight: "2.3em",
    letterSpacing: "0.06em",
    color: theme.ink,
    whiteSpace: "pre-wrap" as const,
    maxHeight: 320,
    overflow: "hidden",
  };

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        // flex column に直接置かれても潰れないように(overflow:hidden があると
        // flex item の min-height が auto ではなく 0 になり、収まりきらないとき
        // 他の兄弟要素を優先して押し潰されてしまうため)。
        flexShrink: 0,
        boxShadow: "0 14px 44px rgba(150,110,130,0.2)",
        background: `linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
        padding: padding ?? "clamp(20px,4vw,40px) clamp(14px,3vw,30px)",
      }}
    >
      <div
        style={{
          background: theme.paper,
          padding: "34px 28px 26px",
          boxShadow: "0 10px 34px rgba(150,110,130,0.18)",
          position: "relative",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 8,
            border: `1px solid ${withAlpha(theme.accent, 38)}`,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 11,
            border: `1px solid ${withAlpha(theme.accent, 18)}`,
            pointerEvents: "none",
          }}
        />
        <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <svg
            viewBox="0 0 120 28"
            fill="none"
            stroke={theme.gold}
            strokeWidth="1.1"
            strokeLinecap="round"
            style={{ width: 96, height: 22, opacity: 0.9 }}
          >
            <path d="M14 15 H44 M76 15 H106" />
            <path
              d="M60 7.5 C56.8 11 56.8 17.5 60 21.5 C63.2 17.5 63.2 7.5 60 7.5 Z"
              fill={theme.gold}
              stroke="none"
              opacity="0.8"
            />
            <path d="M50 15 C53 13 55.5 13 58 14.2 M70 15 C67 13 64.5 13 62 14.2" />
            <circle cx="48" cy="15" r="1.3" fill={theme.gold} stroke="none" />
            <circle cx="72" cy="15" r="1.3" fill={theme.gold} stroke="none" />
          </svg>
        </div>
        <div
          style={{
            fontFamily: font,
            fontSize: FONT_SIZE.title,
            letterSpacing: "0.16em",
            color: theme.ink,
            textAlign: "center",
            marginBottom: 14,
          }}
        >
          {to || "宛名"}
        </div>
        {hiddenBody ? (
          <div style={{ position: "relative" }}>
            <div
              aria-hidden="true"
              style={{
                ...bodyStyle,
                filter: "blur(5px)",
                opacity: 0.6,
                userSelect: "none",
              }}
            >
              {HIDDEN_BODY_FILLER}
            </div>
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: font,
                fontSize: FONT_SIZE.caption,
                letterSpacing: "0.08em",
                color: theme.inkSoft,
              }}
            >
              <Lock size={13} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
              {HIDDEN_BODY_NOTE}
            </span>
          </div>
        ) : (
          <div style={bodyStyle}>{body || "ここに本文が入ります"}</div>
        )}
        {!hiddenBody && photo && (
          <div
            style={{
              margin: "20px auto 4px",
              width: "min(70%,220px)",
              background: "#FFFFFF",
              padding: "7px 7px 18px",
              boxShadow: "0 4px 14px rgba(150,110,130,0.18)",
              transform: "rotate(-0.8deg)",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: photoRatio || 1.3333,
                backgroundImage: `url('${photo}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        )}
        <div
          style={{
            fontFamily: font,
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.18em",
            color: theme.inkSoft,
            textAlign: "center",
            marginTop: 16,
          }}
        >
          {date}
        </div>
      </div>
    </div>
  );
}
