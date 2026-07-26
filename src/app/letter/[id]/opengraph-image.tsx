import { ImageResponse } from "next/og";
import { THEMES } from "@/components/letter-studio/constants";
import { getLetterForGuest } from "@/lib/server/letters";
import { withAlpha } from "@/lib/color";
import type { FontKey } from "@/lib/server/schema";

export const alt = "花嫁からのお手紙";
// 630×630 に収まる正方形。SNS で切り取られても宛名が中央に残る。
export const size = { width: 630, height: 630 };
export const contentType = "image/png";

/** FontKey → Google Fonts のファミリ名と、宛名に使う字面。 */
const OG_FONT: Record<FontKey, { family: string; weight: number }> = {
  yomogi: { family: "Yomogi", weight: 400 },
  klee: { family: "Klee One", weight: 400 },
  mincho: { family: "Shippori Mincho", weight: 600 },
  gothic: { family: "Zen Kaku Gothic New", weight: 500 },
  maru: { family: "Zen Maru Gothic", weight: 500 },
};

/**
 * 指定した文字だけをサブセットした Google Font の TTF を取得する。
 * Satori は woff2 を読めないため、旧 UA を送って truetype を受け取る。
 */
async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.59.10 (KHTML, like Gecko) Version/5.1.9 Safari/534.59.10",
    },
  }).then((r) => r.text());
  // 旧 UA には woff(Satori 対応)が返る。woff2 は非対応なので除外。
  const match = css.match(/src:\s*url\((.+?)\)\s*format\('(?:truetype|opentype|woff)'\)/);
  if (!match) throw new Error(`font url not found for ${family}`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`font download failed for ${family}`);
  return res.arrayBuffer();
}

/** cardNameFor(geometry.ts) と同じ規則で宛名を組み立てる。 */
function addressee(
  to: string,
  cardName: string | null,
  honor: string | null,
  eventHonor: string
): string {
  const base = cardName || (to ? to.replace(/(さん)?へ$/, "") : "") || "";
  const h = honor ?? eventHonor;
  return h === "" ? base : `${base} ${h}`;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const letter = await getLetterForGuest(id);

  const theme = THEMES[letter?.theme ?? "rose"] ?? THEMES.rose;
  const fontKey: FontKey = letter?.font ?? "yomogi";
  const name = letter
    ? addressee(letter.to, letter.cardName, letter.honor, letter.eventHonor)
    : "";
  const date = letter?.date ?? "";

  const label = "花嫁からのお手紙が届いています";
  const brand = "Hanayori";
  // レンダリングする全文字を集めてサブセット(Japanese フォントは重いので必須)。
  const glyphs = `${name}${date}${label}${brand}あいうえお`;

  const { family, weight } = OG_FONT[fontKey];
  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" }[] = [];
  try {
    fonts.push({
      name: family,
      data: await loadGoogleFont(family, weight, glyphs),
      weight: weight as 400 | 500 | 600,
      style: "normal",
    });
  } catch {
    // フォント取得に失敗しても豆腐にならないよう Noto でフォールバック。
    fonts.push({
      name: "Noto Sans JP",
      data: await loadGoogleFont("Noto Sans JP", 500, glyphs),
      weight: 500,
      style: "normal",
    });
  }
  const fontFamily = fonts[0].name;

  // 宛名が長いほど字を詰める。
  const nameLen = [...name].length;
  const nameSize = nameLen <= 6 ? 68 : nameLen <= 10 ? 52 : nameLen <= 16 ? 40 : 32;

  // 便箋上部の飾り罫(LetterView と同じモチーフ)。
  const flourish = (flip: boolean) => (
    <svg
      width={168}
      height={26}
      viewBox="0 0 120 28"
      fill="none"
      stroke={theme.gold}
      strokeWidth="1.1"
      strokeLinecap="round"
      style={{ opacity: 0.9, ...(flip ? { transform: "rotate(180deg)" } : {}) }}
    >
      <path d="M14 15 H44 M76 15 H106" />
      <path
        d="M60 7.5 C56.8 11 56.8 17.5 60 21.5 C63.2 17.5 63.2 7.5 60 7.5 Z"
        fill={theme.gold}
        stroke="none"
        opacity="0.85"
      />
      <path d="M50 15 C53 13 55.5 13 58 14.2 M70 15 C67 13 64.5 13 62 14.2" />
      <circle cx="48" cy="15" r="1.4" fill={theme.gold} stroke="none" />
      <circle cx="72" cy="15" r="1.4" fill={theme.gold} stroke="none" />
    </svg>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily,
          color: theme.ink,
          padding: 46,
          background: `radial-gradient(120% 70% at 50% -10%, ${theme.bg2} 0%, ${theme.bg1} 45%, ${theme.g1} 78%, ${theme.g2} 100%)`,
        }}
      >
        {/* 便箋 */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: theme.paper,
            boxShadow: "0 20px 60px rgba(140,105,120,0.22), 0 4px 14px rgba(140,105,120,0.12)",
          }}
        >
          {/* 二重の内枠 */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              right: 20,
              bottom: 20,
              border: `1px solid ${withAlpha(theme.accent, 42)}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 26,
              left: 26,
              right: 26,
              bottom: 26,
              border: `1px solid ${withAlpha(theme.accent, 20)}`,
            }}
          />

          {flourish(false)}

          {/* 宛名 */}
          <div
            style={{
              display: "flex",
              marginTop: 40,
              marginBottom: 8,
              fontSize: 20,
              letterSpacing: "0.4em",
              color: theme.inkSoft,
            }}
          >
            To.
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: "78%",
              textAlign: "center",
              fontSize: nameSize,
              lineHeight: 1.3,
              letterSpacing: "0.12em",
              padding: "0 6px",
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              width: 96,
              height: 1,
              marginTop: 22,
              background: withAlpha(theme.accent, 55),
            }}
          />

          <div
            style={{
              display: "flex",
              marginTop: 34,
              fontSize: 22,
              letterSpacing: "0.16em",
              color: theme.inkSoft,
            }}
          >
            {label}
          </div>

          <div style={{ display: "flex", marginTop: 46 }}>{flourish(true)}</div>

          {/* フッター */}
          <div
            style={{
              position: "absolute",
              bottom: 44,
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 16,
              letterSpacing: "0.3em",
              color: theme.inkSoft,
            }}
          >
            {date ? <span style={{ display: "flex" }}>{date}</span> : null}
            {date ? (
              <span style={{ display: "flex", width: 4, height: 4, borderRadius: 4, background: theme.gold }} />
            ) : null}
            <span style={{ display: "flex", color: theme.accent }}>{brand}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
