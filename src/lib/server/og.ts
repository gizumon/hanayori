import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * OG 画像（`opengraph-image.tsx`）が使うフォント読み込み。
 *
 * `next/og` の Satori は woff2 を読めないため、Google Fonts へは旧 UA を送って
 * truetype / woff を受け取る。日本語フォントは丸ごとだと数 MB あるので、
 * 実際に描画する文字だけを `text=` でサブセットするのが必須。
 */

/** `ImageResponse` の `fonts` に渡す 1 書体分。 */
export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600;
  style: "normal";
}

export interface OgFontSpec {
  /** Google Fonts のファミリ名。そのまま `fontFamily` に使う。 */
  family: string;
  weight: 400 | 500 | 600;
  /** サブセットに含める文字（重複は気にしなくてよい）。 */
  text: string;
}

/** woff2 ではなく truetype/woff を返させるための古い Safari の UA。 */
const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.59.10 (KHTML, like Gecko) Version/5.1.9 Safari/534.59.10";

/** 指定した文字だけをサブセットした Google Font のバイト列を取得する。 */
export async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url, { headers: { "User-Agent": LEGACY_UA } }).then((r) => r.text());
  // 旧 UA には woff(Satori 対応)が返る。woff2 は非対応なので除外。
  const match = css.match(/src:\s*url\((.+?)\)\s*format\('(?:truetype|opentype|woff)'\)/);
  if (!match) throw new Error(`font url not found for ${family}`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`font download failed for ${family}`);
  return res.arrayBuffer();
}

/** Google Fonts に無い自前フォント（`public/fonts` 配下）を読む。 */
export async function loadLocalFont(file: string): Promise<ArrayBuffer> {
  const buf = await readFile(join(process.cwd(), "public/fonts", file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/**
 * 複数書体をまとめて取得する。取得に失敗した書体は黙って落とす —
 * OG 画像 1 枚のためにページのビルドやレスポンスを落とさないため
 * （その書体を指定した文字は豆腐になるが、画像自体は出る）。
 */
export async function loadGoogleFonts(specs: OgFontSpec[]): Promise<OgFont[]> {
  const loaded = await Promise.all(
    specs.map(async ({ family, weight, text }): Promise<OgFont | null> => {
      try {
        return { name: family, data: await loadGoogleFont(family, weight, text), weight, style: "normal" };
      } catch {
        return null;
      }
    })
  );
  return loaded.filter((font): font is OgFont => font !== null);
}
