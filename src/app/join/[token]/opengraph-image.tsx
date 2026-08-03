import { ImageResponse } from "next/og";
import { THEMES } from "@/components/letter-studio/constants";
import { withAlpha } from "@/lib/color";
import { COLOR } from "@/lib/palette";
import { getInvitePreview } from "@/lib/server/invites";
import { loadGoogleFonts } from "@/lib/server/og";

/**
 * 招待リンクの OG 画像。LINE などに貼られたときに「何に招待されたのか」が
 * プレビューだけで分かるよう、イベント名を大きく出す。
 *
 * ページ本体（GET）と同じくトークンは**消費しない** — リンクプレビューの
 * 巡回で使い切りの招待が潰れるのを防ぐため、`getInvitePreview` は読むだけ。
 */
export const alt = "Hanayori のイベントへの招待";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 正方形クロップ（Slack や LINE のサムネイル、X の summary カード）で残る幅。
 * 見出しはこの内側で折り返させ、どの経路でも文字が切れないようにする。
 */
const SAFE_WIDTH = size.height - 60;

const MINCHO = "Shippori Mincho";
const GOTHIC = "Zen Kaku Gothic New";

const BRAND = "Hanayori";
const BRAND_JA = "花嫁のお便り";
const OVERLINE = "INVITATION";

/** イベント名は 1〜2 行に収まる長さで打ち切る（版面が崩れるより省略のほうがまし）。 */
const MAX_TITLE = 34;

/**
 * 招待の状態ごとの見出し。
 * イベント名が読めたときだけ名前を主役にし、受け取れない招待は理由を出す。
 */
function copyFor(
  status: "active" | "expired" | "accepted" | "invalid",
  eventName: string | null
): { title: string; lead: string; invited: boolean } {
  if (status === "active" && eventName) {
    const chars = [...eventName];
    const title = chars.length > MAX_TITLE ? `${chars.slice(0, MAX_TITLE).join("")}…` : eventName;
    return { title, lead: "お手紙づくりに招待されています", invited: true };
  }
  if (status === "accepted") {
    return {
      title: "この招待リンクは使用済みです",
      lead: "招待した方に新しいリンクをお願いしてください",
      invited: false,
    };
  }
  if (status === "expired") {
    return {
      title: "この招待リンクは期限切れです",
      lead: "招待した方に新しいリンクをお願いしてください",
      invited: false,
    };
  }
  return { title: "招待リンクが見つかりません", lead: "URL が正しいかご確認ください", invited: false };
}

/** 便箋上部の飾り罫（LetterView / 他の OG 画像と同じモチーフ）。 */
function Flourish({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <svg
      width={150}
      height={22}
      viewBox="0 0 120 28"
      fill="none"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
      style={{ opacity: 0.9, ...(flip ? { transform: "rotate(180deg)" } : {}) }}
    >
      <path d="M14 15 H44 M76 15 H106" />
      <path d="M60 7.5 C56.8 11 56.8 17.5 60 21.5 C63.2 17.5 63.2 7.5 60 7.5 Z" fill={color} stroke="none" opacity="0.85" />
      <path d="M50 15 C53 13 55.5 13 58 14.2 M70 15 C67 13 64.5 13 62 14.2" />
      <circle cx="48" cy="15" r="1.4" fill={color} stroke="none" />
      <circle cx="72" cy="15" r="1.4" fill={color} stroke="none" />
    </svg>
  );
}

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Firestore が読めなくても OG 画像は返す（プレビューが壊れるだけで済ませる）。
  const preview = await getInvitePreview(token).catch(() => ({
    status: "invalid" as const,
    eventName: null,
  }));
  const { title, lead, invited } = copyFor(preview.status, preview.eventName);

  const theme = THEMES.rose;
  const fonts = await loadGoogleFonts([
    { family: MINCHO, weight: 600, text: `${title}${BRAND}` },
    { family: GOTHIC, weight: 500, text: `${lead}${BRAND_JA}${OVERLINE}` },
  ]);

  // イベント名が長いほど字を詰める（SAFE_WIDTH の中で 3 行までに収まる大きさ）。
  const titleLen = [...title].length;
  const titleSize = titleLen <= 8 ? 60 : titleLen <= 14 ? 46 : titleLen <= 24 ? 38 : 32;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 56,
          fontFamily: MINCHO,
          color: COLOR.ink,
          background: `radial-gradient(120% 70% at 50% -10%, ${theme.bg2} 0%, ${theme.bg1} 45%, ${theme.g1} 78%, ${theme.g2} 100%)`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 72px",
            background: COLOR.surface,
            borderRadius: 24,
            boxShadow: `0 20px 60px ${withAlpha(theme.accent, 30)}`,
          }}
        >
          {/* 封筒アイコン（招待＝封書、というモチーフ） */}
          <div style={{ display: "flex", marginBottom: 26 }}>
            <svg width={76} height={76} viewBox="0 0 76 76" fill="none">
              <circle cx="38" cy="38" r="37.5" fill={COLOR.tintRose} stroke={COLOR.borderSoft} />
              <rect x="21" y="27" width="34" height="23" rx="3" fill={COLOR.surfaceRaised} stroke={COLOR.accent} strokeWidth="1.4" />
              <path d="M21.5 28.5 L38 40 L54.5 28.5" fill="none" stroke={COLOR.accent} strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>

          {/* 受け取れない招待に "INVITATION" は付けない（誘い文句に見えてしまうため）。 */}
          {invited ? (
            <div
              style={{
                display: "flex",
                fontFamily: GOTHIC,
                fontSize: 17,
                letterSpacing: "0.34em",
                color: COLOR.accentInk,
                marginBottom: 22,
              }}
            >
              {OVERLINE}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              maxWidth: SAFE_WIDTH,
              textAlign: "center",
              fontSize: titleSize,
              lineHeight: 1.4,
              letterSpacing: "0.1em",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: GOTHIC,
              fontSize: 22,
              letterSpacing: "0.08em",
              color: COLOR.inkSoft,
              marginTop: 20,
            }}
          >
            {lead}
          </div>

          <div style={{ display: "flex", marginTop: 40 }}>
            <Flourish color={theme.gold} flip />
          </div>

          {/* フッター */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.14em", color: COLOR.accentDeep }}>{BRAND}</div>
            <div style={{ display: "flex", width: 4, height: 4, borderRadius: 4, background: theme.gold }} />
            <div style={{ display: "flex", fontFamily: GOTHIC, fontSize: 15, letterSpacing: "0.22em", color: COLOR.inkMuted }}>
              {BRAND_JA}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) }
  );
}
