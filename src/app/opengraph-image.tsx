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
 *
 * 構図は「中央セーフ」— Slack や LINE のサムネイル、X の summary カードなど
 * 中央を正方形に切り抜く経路があるため、封筒とブランドロゴは中央 630×630
 * （= SAFE_LEFT〜SAFE_RIGHT）の内側に収める。左右のコピーは対称に切れる。
 */
export const alt = "Hanayori | 花嫁のお便り — 結婚式のゲストひとりひとりに宛てたデジタルのお手紙";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 正方形クロップで残る範囲。この内側に主役（封筒・ブランド）を置く。 */
const SAFE_LEFT = (size.width - size.height) / 2; // 285
const SAFE_RIGHT = size.width - SAFE_LEFT; // 915
const CENTER = size.width / 2;

const MINCHO = "Shippori Mincho";
const GOTHIC = "Zen Kaku Gothic New";
const HAND = "Yomogi";

const HEADLINE = ["大切なあの人へ、", "結婚式の日に届く", "一通のお手紙を。"];
const LEAD = ["結婚式のゲストひとりひとりに", "宛てた、デジタルのお手紙を", "つくれるサービス。"];
const NOTE = ["いつも ありがとう。", "伝えきれなかった想いを、", "一通のお手紙にのせて。"];

const OVERLINE = "WEDDING LETTER SERVICE";
const BRAND = "Hanayori";
const BRAND_JA = "花嫁のお便り";
const ADDRESSEE = "あなたへ";

/** 便箋上部の飾り罫（LetterView / 手紙の OG 画像と同じモチーフ）。 */
function Flourish({ color }: { color: string }) {
  return (
    <svg width={116} height={18} viewBox="0 0 120 28" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" style={{ opacity: 0.9 }}>
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
    { family: MINCHO, weight: 600, text: `${HEADLINE.join("")}${BRAND}` },
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
          position: "relative",
          fontFamily: MINCHO,
          color: COLOR.ink,
          background: `radial-gradient(120% 70% at 50% -10%, ${theme.bg2} 0%, ${theme.bg1} 45%, ${theme.g1} 78%, ${theme.g2} 100%)`,
        }}
      >
        <Petal x={92} y={64} scale={1} rotate={18} opacity={0.35} />
        <Petal x={1058} y={112} scale={1.3} rotate={-24} opacity={0.3} />
        <Petal x={612} y={30} scale={0.8} rotate={42} opacity={0.22} />
        <Petal x={148} y={548} scale={1.1} rotate={-12} opacity={0.28} />
        <Petal x={1024} y={544} scale={0.9} rotate={30} opacity={0.24} />

        {/* 左：キャッチコピー（正方形クロップでは右半分だけが残る） */}
        <div
          style={{
            position: "absolute",
            left: 76,
            top: 172,
            width: 350,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: GOTHIC,
              fontSize: 13,
              letterSpacing: "0.24em",
              color: COLOR.accentInk,
              marginBottom: 20,
            }}
          >
            {OVERLINE}
          </div>

          {HEADLINE.map((line) => (
            <div key={line} style={{ display: "flex", fontSize: 38, lineHeight: 1.52, letterSpacing: "0.08em" }}>
              {line}
            </div>
          ))}

          <div style={{ display: "flex", width: 64, height: 1, marginTop: 26, background: COLOR.gold }} />
        </div>

        {/* 中央：封筒から覗く便箋（主役。正方形クロップでも必ず全体が残る） */}
        <div
          style={{
            position: "absolute",
            left: CENTER - 180,
            top: 58,
            width: 360,
            height: 404,
            display: "flex",
            transform: "rotate(-2.5deg)",
          }}
        >
          {/* 便箋 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 48,
              width: 264,
              height: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "26px 22px",
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
                fontSize: 20,
                letterSpacing: "0.16em",
                color: theme.ink,
                marginTop: 18,
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
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  color: theme.ink,
                  marginTop: i === 0 ? 16 : 10,
                }}
              >
                {line}
              </div>
            ))}
          </div>

          {/* 封筒（開いた状態。便箋の下半分を隠す） */}
          <div style={{ position: "absolute", left: 0, bottom: 0, display: "flex" }}>
            <svg width={360} height={182} viewBox="0 0 360 182" fill="none">
              <rect x="0.5" y="0.5" width="359" height="181" rx="6" fill={COLOR.surface} stroke={withAlpha(theme.accent, 40)} />
              <path d="M0 182 L180 92 L360 182" fill="none" stroke={withAlpha(theme.accent, 32)} strokeWidth="1.2" />
              <circle cx="180" cy="92" r="19" fill={theme.accent} opacity="0.92" />
              <circle cx="180" cy="92" r="12.5" fill="none" stroke={withAlpha(COLOR.onAccent, 75)} strokeWidth="1.6" />
            </svg>
          </div>
        </div>

        {/* 右：リード文（左のコピーと対称に、クロップでは左端だけが残る） */}
        <div
          style={{
            position: "absolute",
            left: SAFE_RIGHT - 43,
            top: 236,
            width: 280,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {LEAD.map((line) => (
            <div
              key={line}
              style={{
                display: "flex",
                fontFamily: GOTHIC,
                fontSize: 16,
                lineHeight: 2,
                letterSpacing: "0.04em",
                color: COLOR.inkSoft,
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* 下中央：ブランドロックアップ（クロップ後もここが必ず残る） */}
        <div
          style={{
            position: "absolute",
            left: SAFE_LEFT,
            right: SAFE_LEFT,
            bottom: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
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
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) }
  );
}
