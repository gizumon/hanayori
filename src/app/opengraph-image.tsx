import { ImageResponse } from "next/og";
import { THEMES } from "@/components/letter-studio/constants";
import { withAlpha } from "@/lib/color";
import { COLOR } from "@/lib/palette";
import { loadGoogleFonts } from "@/lib/server/og";

/**
 * サービス全体の既定 OG 画像（ランディングページの意匠）。
 *
 * `app/` 直下に置いてあるので、独自の `opengraph-image` を持たないルート
 * （/events・/privacy・/terms …）もこれを継承する。
 */
export const alt = "Hanayori | 花嫁のお便り — 結婚式のゲストひとりひとりに宛てたデジタルのお手紙";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MINCHO = "Shippori Mincho";
const GOTHIC = "Zen Kaku Gothic New";
const HAND = "Yomogi";

const HEADLINE = ["大切なあの人へ、", "結婚式の日に届く", "一通のお手紙を。"];
const LEAD = [
  "結婚式のゲストひとりひとりに宛てた、",
  "デジタルのお手紙をつくれるサービス。",
];
const NOTE = ["いつも ありがとう。", "伝えきれなかった想いを、", "一通のお手紙にのせて。"];

const OVERLINE = "花嫁のお便り — WEDDING LETTER SERVICE";
const BRAND = "Hanayori";
const BRAND_JA = "花嫁のお便り";
const ADDRESSEE = "あなたへ";

/** 便箋上部の飾り罫（LetterView / 手紙の OG 画像と同じモチーフ）。 */
function Flourish({ color }: { color: string }) {
  return (
    <svg width={132} height={20} viewBox="0 0 120 28" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" style={{ opacity: 0.9 }}>
      <path d="M14 15 H44 M76 15 H106" />
      <path d="M60 7.5 C56.8 11 56.8 17.5 60 21.5 C63.2 17.5 63.2 7.5 60 7.5 Z" fill={color} stroke="none" opacity="0.85" />
      <path d="M50 15 C53 13 55.5 13 58 14.2 M70 15 C67 13 64.5 13 62 14.2" />
      <circle cx="48" cy="15" r="1.4" fill={color} stroke="none" />
      <circle cx="72" cy="15" r="1.4" fill={color} stroke="none" />
    </svg>
  );
}

/** ランディングのロゴマーク（封筒）を SVG で再現したもの。 */
function LogoMark() {
  return (
    <svg width={44} height={31} viewBox="0 0 44 31" fill="none">
      <rect x="0.5" y="0.5" width="43" height="30" rx="3" fill={COLOR.surface} stroke={COLOR.border} />
      <path d="M0.5 0.5 H43.5 L22 17.5 Z" fill={COLOR.tint} stroke={withAlpha(COLOR.accent, 55)} strokeWidth="1" />
      <circle cx="22" cy="15.5" r="4.6" fill={COLOR.accent} />
    </svg>
  );
}

/** 背景に散らす花びら（ランディングの Petals と同じ形）。 */
function Petal({ x, y, scale, rotate, opacity }: { x: number; y: number; scale: number; rotate: number; opacity: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        opacity,
        transform: `rotate(${rotate}deg) scale(${scale})`,
      }}
    >
      <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <path d="M12 2 C7 7 7 17 12 22 C17 17 17 7 12 2 Z" fill={COLOR.gold} />
      </svg>
    </div>
  );
}

export default async function Image() {
  const theme = THEMES.rose;
  const fonts = await loadGoogleFonts([
    {
      family: MINCHO,
      weight: 600,
      text: `${HEADLINE.join("")}${BRAND}${BRAND_JA}${OVERLINE}`,
    },
    { family: GOTHIC, weight: 500, text: `${LEAD.join("")}${OVERLINE}${BRAND_JA}` },
    { family: HAND, weight: 400, text: `${ADDRESSEE}${NOTE.join("")}` },
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          position: "relative",
          fontFamily: MINCHO,
          color: COLOR.ink,
          background: `radial-gradient(120% 70% at 50% -10%, ${theme.bg2} 0%, ${theme.bg1} 45%, ${theme.g1} 78%, ${theme.g2} 100%)`,
        }}
      >
        <Petal x={92} y={64} scale={1} rotate={18} opacity={0.35} />
        <Petal x={1058} y={112} scale={1.3} rotate={-24} opacity={0.3} />
        <Petal x={640} y={40} scale={0.8} rotate={42} opacity={0.25} />
        <Petal x={148} y={548} scale={1.1} rotate={-12} opacity={0.28} />
        <Petal x={996} y={556} scale={0.9} rotate={30} opacity={0.22} />

        {/* 左：キャッチコピー */}
        <div style={{ display: "flex", flexDirection: "column", paddingLeft: 86, width: 660 }}>
          <div
            style={{
              display: "flex",
              fontFamily: GOTHIC,
              fontSize: 17,
              letterSpacing: "0.26em",
              color: COLOR.accentInk,
              marginBottom: 24,
            }}
          >
            {OVERLINE}
          </div>

          {HEADLINE.map((line) => (
            <div key={line} style={{ display: "flex", fontSize: 47, lineHeight: 1.52, letterSpacing: "0.1em" }}>
              {line}
            </div>
          ))}

          <div style={{ display: "flex", width: 76, height: 1, margin: "30px 0 26px", background: COLOR.gold }} />

          {LEAD.map((line) => (
            <div
              key={line}
              style={{
                display: "flex",
                fontFamily: GOTHIC,
                fontSize: 18,
                lineHeight: 1.95,
                letterSpacing: "0.05em",
                color: COLOR.inkSoft,
              }}
            >
              {line}
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 40 }}>
            <LogoMark />
            <div style={{ display: "flex", fontSize: 30, letterSpacing: "0.12em" }}>{BRAND}</div>
            <div
              style={{
                display: "flex",
                fontFamily: GOTHIC,
                fontSize: 15,
                letterSpacing: "0.22em",
                color: COLOR.accentInk,
                paddingTop: 6,
              }}
            >
              {BRAND_JA}
            </div>
          </div>
        </div>

        {/* 右：封筒から覗く便箋 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 430,
            height: 472,
            marginLeft: 24,
            transform: "rotate(-2.5deg)",
          }}
        >
          {/* 便箋 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 58,
              width: 314,
              height: 352,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "30px 26px",
              background: theme.paper,
              boxShadow: `0 18px 46px ${withAlpha(theme.accent, 30)}`,
              border: `1px solid ${withAlpha(theme.accent, 22)}`,
            }}
          >
            <Flourish color={theme.gold} />
            <div
              style={{
                display: "flex",
                fontFamily: HAND,
                fontSize: 23,
                letterSpacing: "0.16em",
                color: theme.ink,
                marginTop: 22,
              }}
            >
              {ADDRESSEE}
            </div>
            {NOTE.map((line, i) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  fontFamily: HAND,
                  fontSize: 15,
                  letterSpacing: "0.05em",
                  color: theme.ink,
                  marginTop: i === 0 ? 20 : 12,
                }}
              >
                {line}
              </div>
            ))}
          </div>

          {/* 封筒（開いた状態。便箋の下半分を隠す） */}
          <div style={{ position: "absolute", left: 0, bottom: 0, display: "flex" }}>
            <svg width={430} height={214} viewBox="0 0 430 214" fill="none">
              <rect x="0.5" y="0.5" width="429" height="213" rx="6" fill={COLOR.surface} stroke={withAlpha(theme.accent, 40)} />
              <path d="M0 214 L215 108 L430 214" fill="none" stroke={withAlpha(theme.accent, 32)} strokeWidth="1.2" />
              <circle cx="215" cy="108" r="21" fill={theme.accent} opacity="0.92" />
              <circle cx="215" cy="108" r="14" fill="none" stroke={withAlpha(COLOR.onAccent, 75)} strokeWidth="1.6" />
            </svg>
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) }
  );
}
